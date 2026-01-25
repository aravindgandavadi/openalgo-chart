/**
 * Template Manager for saving and loading drawing configurations
 */

import { getJSON, setJSON, safeParseJSON, STORAGE_KEYS } from '../services/storageService';
import logger from './logger';

// Interfaces
export interface DrawingOptions {
    color?: string;
    lineWidth?: number;
    fillColor?: string;
    levels?: number[];
    [key: string]: unknown;
}

export interface DrawingTemplate {
    id: string;
    name: string;
    tool: string;
    options: DrawingOptions;
    isDefault: boolean;
    icon: string;
    createdAt?: string;
    updatedAt?: string;
    importedAt?: string;
}

export interface TemplateUpdates {
    name?: string;
    tool?: string;
    options?: DrawingOptions;
    icon?: string;
}

export interface AppliedTemplate {
    tool: string;
    options: DrawingOptions;
}

export interface TemplatesMap {
    [name: string]: DrawingTemplate;
}

export class TemplateManager {
    private templates: TemplatesMap;

    constructor() {
        this.templates = this.loadTemplates();
    }

    // Load templates from localStorage
    loadTemplates(): TemplatesMap {
        const saved = getJSON(STORAGE_KEYS.DRAWING_TEMPLATES, null) as TemplatesMap | null;
        if (saved && typeof saved === 'object') {
            return saved;
        }
        return this.getDefaultTemplates();
    }

    // Get default built-in templates
    getDefaultTemplates(): TemplatesMap {
        return {
            'Support/Resistance': {
                id: 'default_sr',
                name: 'Support/Resistance',
                tool: 'horizontal',
                options: {
                    color: '#2196F3',
                    lineWidth: 2,
                },
                isDefault: true,
                icon: '📊'
            },
            'Fibonacci Golden': {
                id: 'default_fib',
                name: 'Fibonacci Golden',
                tool: 'fibonacci',
                options: {
                    color: '#FF9800',
                    lineWidth: 2,
                    levels: [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1]
                },
                isDefault: true,
                icon: '🔱'
            },
            'Bullish Pattern': {
                id: 'default_bull',
                name: 'Bullish Pattern',
                tool: 'trendline',
                options: {
                    color: '#4CAF50',
                    lineWidth: 2,
                    fillColor: 'rgba(76, 175, 80, 0.1)'
                },
                isDefault: true,
                icon: '📈'
            },
            'Bearish Pattern': {
                id: 'default_bear',
                name: 'Bearish Pattern',
                tool: 'trendline',
                options: {
                    color: '#F23645',
                    lineWidth: 2,
                    fillColor: 'rgba(242, 54, 69, 0.1)'
                },
                isDefault: true,
                icon: '📉'
            },
            'Key Level': {
                id: 'default_key',
                name: 'Key Level',
                tool: 'horizontal',
                options: {
                    color: '#FFEB3B',
                    lineWidth: 3,
                },
                isDefault: true,
                icon: '⭐'
            },
            'Trend Channel': {
                id: 'default_channel',
                name: 'Trend Channel',
                tool: 'parallel_channel',
                options: {
                    color: '#9C27B0',
                    lineWidth: 2,
                    fillColor: 'rgba(156, 39, 176, 0.1)'
                },
                isDefault: true,
                icon: '📐'
            }
        };
    }

    // Save a new template
    saveTemplate(name: string, tool: string, options: DrawingOptions, icon: string = '📌'): string {
        const id = `custom_${Date.now()}`;
        this.templates[name] = {
            id,
            name,
            tool,
            options: { ...options },
            isDefault: false,
            icon,
            createdAt: new Date().toISOString()
        };
        this.persist();
        return id;
    }

    // Delete a template (only custom templates can be deleted)
    deleteTemplate(name: string): boolean {
        const template = this.templates[name];
        if (template && !template.isDefault) {
            delete this.templates[name];
            this.persist();
            return true;
        }
        return false;
    }

    // Update an existing template
    updateTemplate(name: string, updates: TemplateUpdates): boolean {
        const template = this.templates[name];
        if (template && !template.isDefault) {
            this.templates[name] = {
                ...template,
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.persist();
            return true;
        }
        return false;
    }

    // Get a template by name
    getTemplate(name: string): DrawingTemplate | null {
        return this.templates[name] || null;
    }

    // Get all templates
    getAllTemplates(): DrawingTemplate[] {
        return Object.values(this.templates);
    }

    // Get only custom templates
    getCustomTemplates(): DrawingTemplate[] {
        return Object.values(this.templates).filter(t => !t.isDefault);
    }

    // Get only default templates
    getDefaultTemplatesList(): DrawingTemplate[] {
        return Object.values(this.templates).filter(t => t.isDefault);
    }

    // Apply a template (returns the options to use for a new drawing)
    applyTemplate(name: string): AppliedTemplate | null {
        const template = this.templates[name];
        if (template) {
            return {
                tool: template.tool,
                options: { ...template.options }
            };
        }
        return null;
    }

    // Persist templates to localStorage
    persist(): void {
        setJSON(STORAGE_KEYS.DRAWING_TEMPLATES, this.templates);
    }

    // Export templates as JSON file
    exportTemplates(): void {
        const customTemplates = this.getCustomTemplates();
        const dataStr = JSON.stringify(customTemplates, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportName = `tradingview-templates-${new Date().toISOString().split('T')[0]}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportName);
        linkElement.click();
    }

    // Import templates from JSON file
    importTemplates(jsonData: string | DrawingTemplate[]): boolean {
        try {
            const imported: DrawingTemplate[] = typeof jsonData === 'string'
                ? safeParseJSON(jsonData) as DrawingTemplate[]
                : jsonData;

            if (Array.isArray(imported)) {
                imported.forEach(template => {
                    if (template.name && template.tool && template.options) {
                        const name = template.name;
                        // Ensure we don't overwrite defaults
                        if (!this.templates[name] || !this.templates[name].isDefault) {
                            this.templates[name] = {
                                ...template,
                                isDefault: false,
                                importedAt: new Date().toISOString()
                            };
                        }
                    }
                });
                this.persist();
                return true;
            }
        } catch (error) {
            logger.error('Error importing templates:', error);
        }
        return false;
    }

    // Get favorite templates (stored separately)
    getFavorites(): string[] {
        const saved = getJSON(STORAGE_KEYS.TEMPLATE_FAVORITES, []) as string[];
        return Array.isArray(saved) ? saved : [];
    }

    // Toggle favorite status
    toggleFavorite(templateName: string): string[] {
        const favorites = this.getFavorites();
        const index = favorites.indexOf(templateName);

        if (index === -1) {
            favorites.push(templateName);
        } else {
            favorites.splice(index, 1);
        }

        setJSON(STORAGE_KEYS.TEMPLATE_FAVORITES, favorites);
        return favorites;
    }
}

export default TemplateManager;
