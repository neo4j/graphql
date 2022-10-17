export {};

type Analytics = {
    SNIPPET_VERSION: string;
    _writeKey: string;
    _loadOptions: unknown;
    initialize: boolean;
    invoked: boolean;
    methods: string[];
    factory: (e: string) => void;
    push: (e: unknown) => void;
    load: (key: string, e?: string | undefined) => void;
    page: () => void;
    track: (key: string, e: unknown) => void;
};

declare global {
    interface Window {
        analytics: Analytics;
    }
}
