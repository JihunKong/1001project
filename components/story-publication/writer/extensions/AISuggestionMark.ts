import { Mark } from '@tiptap/core';

export interface AISuggestionOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    aiSuggestion: {
      setAISuggestion: (attributes: { suggestionId: string; suggestionType: string; suggestionIndex: number }) => ReturnType;
      unsetAISuggestion: () => ReturnType;
    };
  }
}

export const AISuggestionMark = Mark.create<AISuggestionOptions>({
  name: 'aiSuggestion',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      suggestionId: {
        default: null,
        parseHTML: element => element.getAttribute('data-suggestion-id'),
        renderHTML: attributes => {
          if (!attributes.suggestionId) {
            return {};
          }
          return {
            'data-suggestion-id': attributes.suggestionId,
          };
        },
      },
      suggestionType: {
        default: 'GRAMMAR',
        parseHTML: element => element.getAttribute('data-suggestion-type'),
        renderHTML: attributes => {
          if (!attributes.suggestionType) {
            return {};
          }
          return {
            'data-suggestion-type': attributes.suggestionType,
          };
        },
      },
      suggestionIndex: {
        default: 0,
        parseHTML: element => parseInt(element.getAttribute('data-suggestion-index') || '0', 10),
        renderHTML: attributes => {
          return {
            'data-suggestion-index': attributes.suggestionIndex,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-suggestion-id]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const suggestionType = (HTMLAttributes['data-suggestion-type'] || 'GRAMMAR').toLowerCase();

    return [
      'span',
      {
        ...HTMLAttributes,
        class: `ai-suggestion ai-suggestion-${suggestionType}`,
        style: 'cursor: pointer;',
      },
      0,
    ];
  },

  addCommands() {
    return {
      setAISuggestion:
        attributes =>
        ({ commands }) => {
          return commands.setMark(this.name, attributes);
        },
      unsetAISuggestion:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
});
