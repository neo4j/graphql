export type EventMeta =
    | {
          event: "create";
          id: string;
          oldProps: undefined;
          newProps: Record<string, any>;
          timestamp: number;
      }
    | {
          event: "update";
          id: string;
          oldProps: Record<string, any>;
          newProps: Record<string, any>;
          timestamp: number;
      }
    | {
          event: "delete";
          id: string;
          oldProps: Record<string, any>;
          newProps: undefined;
          timestamp: number;
      };
