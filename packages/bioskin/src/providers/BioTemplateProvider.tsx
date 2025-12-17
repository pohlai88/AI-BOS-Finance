/**
 * BioTemplateProvider - Template system for forms
 * 
 * Provides template management (save, load, share) for form data.
 * Supports user-level and team-level templates.
 * 
 * @example
 * <BioTemplateProvider>
 *   <BioForm schema={InvoiceSchema} templates={templates} />
 * </BioTemplateProvider>
 */

'use client';

import * as React from 'react';
import { z } from 'zod';

// ============================================================
// Types
// ============================================================

export interface Template<T = Record<string, unknown>> {
  /** Unique template ID */
  id: string;
  /** Template name */
  name: string;
  /** Template description */
  description?: string;
  /** Template category */
  category?: string;
  /** Template data */
  data: Partial<T>;
  /** Is template shared (team-level) */
  shared?: boolean;
  /** Created by user ID */
  createdBy?: string;
  /** Created date */
  createdAt?: Date;
  /** Last used date */
  lastUsedAt?: Date;
  /** Usage count */
  usageCount?: number;
}

export interface BioTemplateProviderProps {
  children: React.ReactNode;
  /** Storage adapter (localStorage by default) */
  storage?: TemplateStorage;
  /** Initial templates */
  initialTemplates?: Template[];
}

export interface TemplateStorage {
  /** Save template */
  save: (template: Template) => Promise<void>;
  /** Load template by ID */
  load: (id: string) => Promise<Template | null>;
  /** List all templates */
  list: (options?: { category?: string; shared?: boolean }) => Promise<Template[]>;
  /** Delete template */
  delete: (id: string) => Promise<void>;
}

export interface TemplateContextValue {
  /** Save a template */
  saveTemplate: <T>(template: Omit<Template<T>, 'id' | 'createdAt'>) => Promise<string>;
  /** Load a template */
  loadTemplate: (id: string) => Promise<Template | null>;
  /** List templates */
  listTemplates: (options?: { category?: string; shared?: boolean }) => Promise<Template[]>;
  /** Delete a template */
  deleteTemplate: (id: string) => Promise<void>;
  /** Use a template (loads and tracks usage) */
  useTemplate: (id: string) => Promise<Template | null>;
  /** Get template by ID */
  getTemplate: (id: string) => Template | null;
  /** All templates */
  templates: Template[];
}

// ============================================================
// Default Storage (localStorage)
// ============================================================

class LocalStorageTemplateStorage implements TemplateStorage {
  private readonly key = 'bioskin_templates';

  async save(template: Template): Promise<void> {
    const templates = await this.list();
    const existingIndex = templates.findIndex(t => t.id === template.id);

    const templateToSave: Template = {
      ...template,
      createdAt: template.createdAt || new Date(),
      lastUsedAt: template.lastUsedAt || new Date(),
    };

    if (existingIndex >= 0) {
      templates[existingIndex] = templateToSave;
    } else {
      templates.push(templateToSave);
    }

    try {
      localStorage.setItem(this.key, JSON.stringify(templates));
    } catch (error) {
      console.error('Failed to save template:', error);
      throw new Error('Failed to save template');
    }
  }

  async load(id: string): Promise<Template | null> {
    const templates = await this.list();
    return templates.find(t => t.id === id) || null;
  }

  async list(options?: { category?: string; shared?: boolean }): Promise<Template[]> {
    try {
      const stored = localStorage.getItem(this.key);
      if (!stored) return [];

      const templates: Template[] = JSON.parse(stored).map((t: any) => ({
        ...t,
        createdAt: t.createdAt ? new Date(t.createdAt) : undefined,
        lastUsedAt: t.lastUsedAt ? new Date(t.lastUsedAt) : undefined,
      }));

      let filtered = templates;

      if (options?.category) {
        filtered = filtered.filter(t => t.category === options.category);
      }

      if (options?.shared !== undefined) {
        filtered = filtered.filter(t => t.shared === options.shared);
      }

      return filtered;
    } catch (error) {
      console.error('Failed to load templates:', error);
      return [];
    }
  }

  async delete(id: string): Promise<void> {
    const templates = await this.list();
    const filtered = templates.filter(t => t.id !== id);

    try {
      localStorage.setItem(this.key, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to delete template:', error);
      throw new Error('Failed to delete template');
    }
  }
}

// ============================================================
// Context
// ============================================================

const TemplateContext = React.createContext<TemplateContextValue | null>(null);

// ============================================================
// Provider
// ============================================================

export function BioTemplateProvider({
  children,
  storage = new LocalStorageTemplateStorage(),
  initialTemplates = [],
}: BioTemplateProviderProps) {
  const [templates, setTemplates] = React.useState<Template[]>(initialTemplates);

  // Load templates on mount
  React.useEffect(() => {
    storage.list().then(setTemplates).catch(console.error);
  }, [storage]);

  const saveTemplate = React.useCallback(
    async <T,>(template: Omit<Template<T>, 'id' | 'createdAt'>): Promise<string> => {
      const id = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newTemplate: Template<T> = {
        ...template,
        id,
        createdAt: new Date(),
        usageCount: 0,
      };

      await storage.save(newTemplate);
      const updated = await storage.list();
      setTemplates(updated);
      return id;
    },
    [storage]
  );

  const loadTemplate = React.useCallback(
    async (id: string): Promise<Template | null> => {
      return storage.load(id);
    },
    [storage]
  );

  const listTemplates = React.useCallback(
    async (options?: { category?: string; shared?: boolean }): Promise<Template[]> => {
      return storage.list(options);
    },
    [storage]
  );

  const deleteTemplate = React.useCallback(
    async (id: string): Promise<void> => {
      await storage.delete(id);
      const updated = await storage.list();
      setTemplates(updated);
    },
    [storage]
  );

  const useTemplate = React.useCallback(
    async (id: string): Promise<Template | null> => {
      const template = await storage.load(id);
      if (template) {
        const updated: Template = {
          ...template,
          lastUsedAt: new Date(),
          usageCount: (template.usageCount || 0) + 1,
        };
        await storage.save(updated);
        const updatedList = await storage.list();
        setTemplates(updatedList);
        return updated;
      }
      return null;
    },
    [storage]
  );

  const getTemplate = React.useCallback(
    (id: string): Template | null => {
      return templates.find(t => t.id === id) || null;
    },
    [templates]
  );

  const value: TemplateContextValue = {
    saveTemplate,
    loadTemplate,
    listTemplates,
    deleteTemplate,
    useTemplate,
    getTemplate,
    templates,
  };

  return <TemplateContext.Provider value={value}>{children}</TemplateContext.Provider>;
}

// ============================================================
// Hook
// ============================================================

export function useTemplates(): TemplateContextValue | null {
  const context = React.useContext(TemplateContext);
  return context;
}

BioTemplateProvider.displayName = 'BioTemplateProvider';
