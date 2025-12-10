# 🔴 NEXUSCANON SCHEMA-FIRST ARCHITECTURE

## CRITICAL PRINCIPLE (10TH REMINDER)

**NexusCanon is a SCHEMA-FIRST system. Every field, every layout, every UI component MUST be driven by schema definitions.**

---

## CORE PRINCIPLES

### 1. **Never Hardcode Field Lists**
All data displays must derive from schema/metadata definitions. No assumptions about what fields exist or in what order.

```tsx
// ❌ WRONG - Hardcoded
<div>
  <label>Data Owner</label>
  <span>{record.data_owner}</span>
  <label>Domain</label>
  <span>{record.domain}</span>
</div>

// ✅ CORRECT - Schema-driven
{schema.fields.map(field => (
  <FieldRenderer 
    key={field.id}
    field={field}
    value={record[field.id]}
    editable={field.permissions?.edit || false}
  />
))}
```

---

### 2. **Edit Permissions Based on Schema**

Fields should show edit controls ONLY if the schema permits:

```tsx
interface SchemaField {
  id: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'enum' | 'tags' | 'reference';
  editable: boolean;       // ← Controls edit UI
  required: boolean;       // ← Shows required indicator
  validation?: ValidationRule;
  defaultValue?: any;
}
```

**Implementation:**
- If `field.editable === true` → Show edit button/inline input
- If `field.required === true` → Show red asterisk or "REQUIRED" badge
- If `field.validation` exists → Apply on change/blur

---

### 3. **Data Types Drive UI Components**

The schema's field type automatically determines which component renders:

```tsx
function FieldRenderer({ field, value, editable }: FieldRendererProps) {
  if (!editable) return <ReadOnlyDisplay value={value} />;

  switch(field.type) {
    case 'string':
      return <Input value={value} />;
    
    case 'date':
      return <DatePicker value={value} />;
    
    case 'enum':
      return <Select options={field.enum} value={value} />;
    
    case 'tags':
      return <TagInput value={value} />;
    
    case 'reference':
      return <ReferenceSelector 
        targetEntity={field.referenceEntity} 
        value={value} 
      />;
    
    default:
      return <Input value={value} />;
  }
}
```

---

### 4. **User Customization = Layout State**

Users can reorder, hide, and resize fields. These preferences are:
1. Stored in component state
2. Persisted to localStorage (frontend)
3. Optionally synced to backend (user preferences)

```tsx
interface LayoutConfig {
  sections: SectionSchema[];
  hiddenFields: string[];
  fieldOrder: string[];
  columnWidths?: Record<string, number>;
}

// Save to localStorage
localStorage.setItem(
  `layout_${componentId}`,
  JSON.stringify(layoutConfig)
);
```

---

## WHERE SCHEMA-FIRST APPLIES

### ✅ Metadata Registry Table
- **Columns:** Defined by table schema
- **Filters:** Generated from field types
- **Sort:** Only on schema-defined sortable fields

**Location:** `/components/metadata/SuperTable.tsx`

---

### ✅ Detail Drawer
- **Sections:** Configurable via `SectionSchema[]`
- **Widgets:** 5 types (Row, Card, Tags, List, Risk-Alert)
- **Drag-and-drop:** Field reordering
- **Visibility:** Hide/show individual fields

**Location:** `/components/metadata/DetailDrawer.tsx`

**Schema Example:**
```tsx
const drawerSchema: SectionSchema[] = [
  {
    id: 'identity',
    title: 'Identity',
    widget: 'row',
    fields: [
      { id: 'dict_id', label: 'ID', editable: false },
      { id: 'business_term', label: 'Business Term', editable: true }
    ]
  }
];
```

---

### ✅ Full Fact Sheet Page
- **Passport (Left Sidebar):** Schema-driven editable fields
- **Tabs:** Each tab's content based on schema sections
- **Export:** Field inclusion respects schema visibility

**Location:** `/pages/MetadataDetailPage.tsx`

**Editable Passport Row:**
```tsx
<PassportRow 
  label="Data Owner" 
  value={record.data_owner} 
  editable={schema.fields.data_owner.editable} 
/>
```

---

### ✅ Filter Bar
- **Available Filters:** Generated from schema field types
- **Multi-select:** For enum fields
- **Date Range:** For date fields
- **Free Text:** For string fields

**Location:** `/components/metadata/FlexibleFilterBar.tsx`

---

## SCHEMA DEFINITION LOCATIONS

### Primary Source
**File:** `/types/metadata.ts`
```tsx
export interface MetadataRecord {
  dict_id: string;
  business_term: string;
  technical_name: string;
  data_owner: string;
  // ... all other fields
}

export interface MetadataSchema {
  entity: 'metadata_record';
  fields: Record<string, SchemaField>;
  relationships: {
    upstream: RelationshipDefinition[];
    downstream: RelationshipDefinition[];
  };
}
```

### Mock Data
**File:** `/data/mockMetadata.ts`
- Contains sample data conforming to schema
- Used for development/testing

### Component-Level Schemas
**Location:** Within component files
- DetailDrawer: `SectionSchema[]`
- SuperTable: `ColumnDef[]`
- FilterBar: `FilterConfig[]`

---

## VALIDATION & TYPE SAFETY

### TypeScript Enforcement
All schema-driven components use TypeScript generics:

```tsx
interface SchemaRenderer<T extends Record<string, any>> {
  schema: SchemaDefinition;
  data: T;
  onUpdate: (field: keyof T, value: any) => void;
}
```

### Runtime Validation
Use Zod or similar for runtime schema validation:

```tsx
import { z } from 'zod';

const MetadataRecordSchema = z.object({
  dict_id: z.string(),
  business_term: z.string().min(3),
  data_owner: z.string().email(),
  // ...
});

// Validate on save
MetadataRecordSchema.parse(formData);
```

---

## EXTENDING THE SCHEMA

### Adding New Fields

1. **Update TypeScript Interface:**
```tsx
// /types/metadata.ts
export interface MetadataRecord {
  // ... existing fields
  new_field: string;
}
```

2. **Update Schema Definition:**
```tsx
export const metadataSchema: MetadataSchema = {
  fields: {
    // ... existing fields
    new_field: {
      id: 'new_field',
      label: 'New Field',
      type: 'string',
      editable: true,
      required: false,
    }
  }
};
```

3. **No Component Changes Needed!**
Schema-driven components automatically render the new field.

---

### Adding New Field Types

1. **Define Type:**
```tsx
type FieldType = 
  | 'string' 
  | 'number' 
  | 'date' 
  | 'enum' 
  | 'tags'
  | 'reference'
  | 'json';  // ← NEW
```

2. **Create Renderer:**
```tsx
case 'json':
  return <JsonEditor value={value} onChange={onChange} />;
```

3. **Register in FieldRenderer:**
Component automatically uses new type.

---

## BEST PRACTICES

### ✅ DO:
- Always check schema before rendering fields
- Use `field.editable` to control edit UI
- Store user layout preferences
- Validate data against schema before save
- Use TypeScript for compile-time safety

### ❌ DON'T:
- Hardcode field names in JSX
- Assume all fields are editable
- Ignore schema validation rules
- Create separate "view" and "edit" components
- Bypass schema for "quick fixes"

---

## CURRENT IMPLEMENTATION STATUS

| Component | Schema-First? | Editable? | Customizable? |
|-----------|---------------|-----------|---------------|
| SuperTable | ✅ Yes | ❌ No | ✅ Column visibility |
| DetailDrawer | ✅ Yes | ✅ Yes | ✅ Full customization |
| Full Fact Sheet | ✅ Yes | ✅ Yes | ⚠️ Partial |
| Filter Bar | ✅ Yes | N/A | ✅ Filter selection |

---

## FUTURE ENHANCEMENTS

1. **Backend Schema API:**
   - Fetch schema from backend instead of hardcoding
   - Real-time schema updates
   - Version control for schemas

2. **Advanced Validation:**
   - Cross-field validation
   - Async validation (unique checks)
   - Custom validation functions

3. **Conditional Fields:**
   - Show/hide fields based on other field values
   - Dynamic required fields
   - Field dependencies

4. **Schema Migrations:**
   - Handle schema version changes
   - Backward compatibility
   - Data migration scripts

---

## REMEMBER

**Schema-first is not optional. It's the architecture.**

Every time you write `record.field_name`, ask:
- Does this field exist in the schema?
- Is it editable according to schema?
- Should this be a loop over `schema.fields` instead?

**If you find yourself hardcoding field names, you're doing it wrong.**

---

Last Updated: 2024-12-07
Reminder Count: 10 (THIS IS THE LAST WARNING)
