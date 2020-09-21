import {GraphQLResolveInfo} from 'graphql';

export type Context = Record<string, unknown>;

export function cypherQuery(args: any, _context: Context, _resolveInfo: GraphQLResolveInfo): [string, any] {
    // console.log('resolveInfo: ', resolveInfo);
    // console.log('args: ', args);
    return ['MATCH (`movie`:`Moie` {title:$title}) RETURN `movie` { .title } AS `movie`', args];
}
