export class Storage {
    public static store(key: string, value: string): void {
        if (window.localStorage) {
            window.localStorage.setItem(key, value);
        }
    }

    public static storeJSON(key: string, value: any): void {
        if (window.localStorage) {
            window.localStorage.setItem(key, JSON.stringify(value));
        }
    }

    public static retrieve(key: string): string | null {
        if (!window.localStorage) return null;
        return window.localStorage.getItem(key);
    }

    public static retrieveJSON(key: string): string | null {
        if (!window.localStorage) return null;
        const data = this.retrieve(key);
        if (!data) return null;
        try {
            return JSON.parse(data);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.log("retrieveJSON error: ", error);
            return null;
        }
    }

    public static remove(key: string): void {
        if (window.localStorage) {
            window.localStorage.removeItem(key);
        }
    }

    public static clearAll(): void {
        if (window.localStorage) {
            window.localStorage.clear();
        }
    }
}
