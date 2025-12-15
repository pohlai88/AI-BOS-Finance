// metadata-studio/db/profiler.executor.ts

/**
 * SQL Profiler Executor
 *
 * Computes data quality statistics for database tables:
 * - Row counts
 * - Null counts per column
 * - Distinct value counts (cardinality)
 * - Min/max/mean/median/stddev for numeric columns
 * - Top N value distributions
 *
 * SAFE: Validates identifiers to prevent SQL injection
 * LIGHTWEIGHT: 1 global COUNT(*) + per-column aggregates
 * GENERIC: Works with any SqlClient (pg Pool, PoolClient, or Drizzle adapter)
 */

export interface SqlClient {
  query<T = any>(text: string, params?: any[]): Promise<{ rows: T[] }>;
}

export interface TopValue {
  value: unknown;
  count: number;
  percentage: number;
}

export interface ColumnProfileResult {
  columnName: string;
  nullCount: number;
  distinctCount: number;
  min: unknown;
  max: unknown;
  mean: number | null;
  median: number | null;
  stdDev: number | null;
  topValues: TopValue[];
}

export interface TableProfileResult {
  rowCount: number;
  columns: ColumnProfileResult[];
}

/**
 * ProfilerExecutor
 *
 * Executes SQL queries to profile database tables and compute statistics.
 *
 * Example usage:
 * ```typescript
 * const pool = new Pool({ connectionString: process.env.DATABASE_URL });
 * const profiler = new ProfilerExecutor(pool);
 *
 * const result = await profiler.profileTable({
 *   schema: 'public',
 *   table: 'sales_transactions',
 *   columns: ['amount', 'quantity', 'customer_id']
 * });
 *
 * console.log(`Row count: ${result.rowCount}`);
 * result.columns.forEach(col => {
 *   console.log(`${col.columnName}: ${col.nullCount} nulls, ${col.distinctCount} distinct`);
 * });
 * ```
 */
export class ProfilerExecutor {
  constructor(private readonly client: SqlClient) {}

  /**
   * Validate SQL identifier to prevent injection attacks.
   *
   * Conservative: only allow a-z, A-Z, 0-9 and underscore, must not start with digit
   */
  private validateIdentifier(name: string, kind: 'schema' | 'table' | 'column'): string {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
      throw new Error(`Invalid ${kind} name: ${name}`);
    }
    return `"${name}"`;
  }

  /**
   * Profile a database table and compute statistics for all columns.
   *
   * @param params.schema - Database schema name (e.g. 'public')
   * @param params.table - Table name (e.g. 'sales_transactions')
   * @param params.columns - Optional: specific columns to profile (defaults to all columns)
   *
   * @returns TableProfileResult with row count and per-column statistics
   *
   * @throws Error if identifiers are invalid or queries fail
   */
  async profileTable(params: {
    schema: string;
    table: string;
    columns?: string[];
  }): Promise<TableProfileResult> {
    const { schema, table } = params;

    const schemaIdent = this.validateIdentifier(schema, 'schema');
    const tableIdent = this.validateIdentifier(table, 'table');

    // ═══════════════════════════════════════════════════════════════════
    // 1) Global rowCount
    // ═══════════════════════════════════════════════════════════════════
    const { rows: [rowCountRow] } = await this.client.query<{ row_count: string }>(
      `SELECT COUNT(*)::bigint AS row_count FROM ${schemaIdent}.${tableIdent}`
    );

    const rowCount = Number(rowCountRow?.row_count ?? 0);

    // ═══════════════════════════════════════════════════════════════════
    // 2) Resolve columns (from information_schema if not explicitly given)
    // ═══════════════════════════════════════════════════════════════════
    let columns = params.columns;
    if (!columns || columns.length === 0) {
      const { rows } = await this.client.query<{ column_name: string }>(
        `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = $2
        ORDER BY ordinal_position
        `,
        [schema, table]
      );
      columns = rows.map((r) => r.column_name);
    }

    // ═══════════════════════════════════════════════════════════════════
    // 3) Get column types for numeric/temporal detection
    // ═══════════════════════════════════════════════════════════════════
    const { rows: typeRows } = await this.client.query<{ column_name: string; data_type: string }>(
      `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = $1 AND table_name = $2
      `,
      [schema, table]
    );
    const typeMap = new Map(typeRows.map((r) => [r.column_name, r.data_type]));

    // ═══════════════════════════════════════════════════════════════════
    // 4) Profile each column
    // ═══════════════════════════════════════════════════════════════════
    const columnResults: ColumnProfileResult[] = [];

    for (const columnName of columns) {
      const safeCol = this.validateIdentifier(columnName, 'column');
      const dataType = typeMap.get(columnName) ?? 'text';

      const isNumeric = [
        'smallint',
        'integer',
        'bigint',
        'numeric',
        'real',
        'double precision',
        'decimal',
      ].includes(dataType);

      const isTemporal = [
        'date',
        'timestamp',
        'timestamp without time zone',
        'timestamp with time zone',
        'time',
        'time without time zone',
        'time with time zone',
      ].includes(dataType);

      // Build aggregate query
      const aggSelectBits: string[] = [
        `COUNT(*) FILTER (WHERE ${safeCol} IS NULL) AS null_count`,
        `COUNT(DISTINCT ${safeCol}) AS distinct_count`,
        `MIN(${safeCol}) AS min_value`,
        `MAX(${safeCol}) AS max_value`,
      ];

      if (isNumeric) {
        aggSelectBits.push(
          `AVG(${safeCol}::numeric) AS mean_value`,
          `PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ${safeCol}::numeric) AS median_value`,
          `STDDEV_POP(${safeCol}::numeric) AS stddev_value`
        );
      } else {
        // For non-numeric/temporal, keep advanced stats null
        aggSelectBits.push(
          `NULL::numeric AS mean_value`,
          `NULL::numeric AS median_value`,
          `NULL::numeric AS stddev_value`
        );
      }

      const aggQuery = `
        SELECT
          ${aggSelectBits.join(', ')}
        FROM ${schemaIdent}.${tableIdent}
      `;

      const { rows: [aggRow] } = await this.client.query<{
        null_count: string;
        distinct_count: string;
        min_value: unknown;
        max_value: unknown;
        mean_value: string | null;
        median_value: string | null;
        stddev_value: string | null;
      }>(aggQuery);

      // ═══════════════════════════════════════════════════════════════════
      // 5) Top values (most frequent)
      // ═══════════════════════════════════════════════════════════════════
      const { rows: topRows } = await this.client.query<{
        value: unknown;
        count: string;
      }>(
        `
        SELECT ${safeCol} AS value, COUNT(*)::bigint AS count
        FROM ${schemaIdent}.${tableIdent}
        GROUP BY ${safeCol}
        ORDER BY COUNT(*) DESC
        LIMIT 5
        `
      );

      const topValues: TopValue[] = topRows.map((row) => {
        const count = Number(row.count);
        const percentage = rowCount === 0 ? 0 : (count / rowCount) * 100;
        return { value: row.value, count, percentage };
      });

      // ═══════════════════════════════════════════════════════════════════
      // 6) Assemble column result
      // ═══════════════════════════════════════════════════════════════════
      columnResults.push({
        columnName,
        nullCount: Number(aggRow?.null_count ?? 0),
        distinctCount: Number(aggRow?.distinct_count ?? 0),
        min: aggRow?.min_value ?? null,
        max: aggRow?.max_value ?? null,
        mean: aggRow?.mean_value != null ? Number(aggRow.mean_value) : null,
        median: aggRow?.median_value != null ? Number(aggRow.median_value) : null,
        stdDev: aggRow?.stddev_value != null ? Number(aggRow.stddev_value) : null,
        topValues,
      });
    }

    return {
      rowCount,
      columns: columnResults,
    };
  }
}

