/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Integer } from "neo4j-driver";

export interface WithProjectorConstructor {
    variables?: string[];
    mutateMetaListVarName?: string;
    subName?: string;

}

export type MutationMetaType =  'Updated' | 'Created' | 'Deleted' | 'Connected' | 'Disconnected' | 'RelationshipUpdated';

/**
 * Mutation Meta Outputs
 * These are interfaces that are returned as a result of queries
 */

export type MutationMetaCommon =
    UpdatedMutationMeta |
    RelationshipUpdatedMutationMeta |
    ConnectedMutationMeta
;

export interface MutationMeta {
    id: Integer;
    name: string;
    type: MutationMetaType;
}
export interface UpdatedMutationMeta extends MutationMeta {
    type: 'Updated',
    properties: any;
}
export interface RelationshipUpdatedMutationMeta extends MutationMeta {
    type: 'Updated',
    properties: any;
    toID: Integer;
    toName: string;
    relationshipName: string;
    relationshipID: Integer;
}
export interface ConnectedMutationMeta extends MutationMeta {
    type: 'Connected',
    properties: any;
    toID: Integer;
    toName: string;
    relationshipName: string;
    relationshipID: Integer;
}

/**
 * Mutation Meta Variables
 * These are interfaces used with the `markMutationMeta` function
 */

export type MutationMetaVarsCommon =
    UpdatedMutationMetaVars |
    ConnectedMutationMetaVars |
    RelationshipUpdatedMutationMetaVars
;

export interface MutationMetaVars {
    idVar: string;
    name: string;
    type: MutationMetaType;
}

export interface UpdatedMutationMetaVars extends MutationMetaVars {
    type: 'Updated';
    propertiesVar?: string;
}

export interface RelationshipUpdatedMutationMetaVars extends MutationMetaVars {
    type: 'RelationshipUpdated';
    propertiesVar?: string;
    toIDVar: string;
    toName: string;
    relationshipName: string;
    relationshipIDVar: string;
}

export interface ConnectedMutationMetaVars extends MutationMetaVars {
    type: 'Connected';
    propertiesVar?: string;
    toIDVar: string;
    toName: string;
    relationshipName: string;
    relationshipIDVar: string;
}

export interface NextBlockOptions {
    declareMutateMeta?: boolean;
    simpleReferencesOnly?: boolean;
    excludeVariables?: string[];
    excludeMutateMeta?: boolean;
}


class WithProjector {
    
    public subName?: string;
    public variables: string[];
    public mutateMetaListVarName: string;
    public mutateMetaVariableDeclared = false;

    protected parent?: WithProjector;
    protected mutationMeta?: MutationMetaVarsCommon;

    constructor(input: WithProjectorConstructor) {
        this.variables = input.variables || [];
        this.subName = input.subName;

        if (input.mutateMetaListVarName) {
            this.mutateMetaListVarName = input.mutateMetaListVarName;
        } else if (this.subName) {
            this.mutateMetaListVarName = `${ this.subName }_mutateMeta`;
        } else {
            this.mutateMetaListVarName = 'mutateMeta';
        }
    }

    addVariable(variableName: string) {
        this.variables.push(variableName);
    }

    /**
     * Used as a variable in a return function
     * @returns `metaList as metaList`, `metaList + [ { id: _id, ... } ]` or empty string
     */
    nextReturn(varName?: string, projStr?: string, opts: NextBlockOptions = {}) {
        if (varName) {
            // eslint-disable-next-line no-param-reassign
            opts.excludeVariables = opts.excludeVariables || [];
            // eslint-disable-next-line no-param-reassign
            opts.excludeVariables = opts.excludeVariables.concat(varName ? [ varName ] : []);
        }

        const returnVars = this.nextBlockVars(opts);
        if (varName && projStr) {
            returnVars.push(`${varName} ${projStr} AS ${varName}`);
        }

        // With may still be required, even though we are not passing any variables.
        // Will probably never happen
        if (returnVars.length === 0) {
            return `RETURN count(*)`;
        }
        return `RETURN ${ returnVars.join(', ') }`;
    }

    nextWith(opts: NextBlockOptions = {}) {
        const withVars = this.nextBlockVars(opts);

        // With may still be required, even though we are not passing any variables.
        // Will probably never happen
        if (withVars.length === 0) {
            return `WITH count(*)`;
        }
        return `WITH ${ withVars.join(', ') }`;
    }

    nextBlockVars(opts: NextBlockOptions = {}) {

        const vars = [ ...this.variables
            .filter((v) => opts.excludeVariables ? !opts.excludeVariables.includes(v) : true)
        ];

        const metaListVariable = this.generateMetaListVariable(opts);

        // Only add this variable if we need it
        if (!opts.excludeMutateMeta && metaListVariable !== '') {
            vars.push(metaListVariable);
        }

        return vars;
    }

    markMutationMeta(mutationMeta: MutationMetaVarsCommon) {
        this.mutationMeta = mutationMeta;

    }

    createChild(subName?: string) {
        const childWithProjector = new WithProjector({
            subName,
            variables: [ ...this.variables ],
        });
        childWithProjector.parent = this;

        return childWithProjector;
    }

    mergeWithChild(child: WithProjector) {
        if (!child) { return ''; }
        const childVarName = child.mutateMetaListVarName;
        if (this.mutateMetaListVarName === childVarName) { return ''; }

        const withVars = this.nextBlockVars({
            excludeMutateMeta: true,
        });

        if (this.mutateMetaVariableDeclared) {
            withVars.push(`${ this.mutateMetaListVarName } + ${ childVarName } as ${ this.mutateMetaListVarName }`);
        } else {
            withVars.push(`${ childVarName } as ${ this.mutateMetaListVarName }`);
            this.mutateMetaVariableDeclared = true;
        }

        return `WITH ${ withVars.join(', ') }`;
    }

    private generateMetaListVariable(opts: NextBlockOptions = {}) {

        // Skip operation if we can only use simple references
        if (opts.simpleReferencesOnly) {
            return this.mutateMetaVariableDeclared ? this.mutateMetaListVarName : '';
        }

        let metaListVariable = '';

        // WITH new metaInfo object
        let mutationMetaOperation: string | undefined;
        if (this.mutationMeta) {
            const props: string[] = [];
            const definiteKeys = Object.keys(this.mutationMeta).filter((k) => !k.endsWith('Var'));
            definiteKeys.forEach((propName) => {
                if (!this.mutationMeta) { return; }
                const definite = this.mutationMeta[propName];
                if (!definite) { return; }
                props.push(`${ propName }: "${ definite }"`);
            });

            const varKeys = Object.keys(this.mutationMeta).filter((k) => k.endsWith('Var'));
            varKeys.forEach((varNameKey) => {
                if (!this.mutationMeta) { return; }
                const propName = varNameKey.replace('Var', '');
                const varName = this.mutationMeta[varNameKey];
                if (!varName) { return; }
                props.push(`${ propName }: ${ varName }`);
            });

            // if (isUpdatedMutationMetaVars(this.mutationMeta)) {
            //     if (this.mutationMeta.propertiesVar) {
            //         props.push(`properties: ${ this.mutationMeta.propertiesVar }`);
            //     }
            // }

            // if ('toIdVar' in this.mutationMeta) {
            //     props.push(`properties: ${ this.mutationMeta.propertiesVar }`);
            // }

            const metaInfo = `{${ props.join(', ') }}`;
            const metaWhere = [
                `metaVal IS NOT NULL`,
                `metaVal.id IS NOT NULL`,
            ];

            mutationMetaOperation = `[ metaVal IN [${ metaInfo }] WHERE ${ metaWhere.join(' AND ') } ]`;
            this.mutationMeta = undefined;
        }

        if        ( this.mutateMetaVariableDeclared &&  mutationMetaOperation) {
            metaListVariable = `${ this.mutateMetaListVarName } + ${ mutationMetaOperation }`;
        } else if ( this.mutateMetaVariableDeclared && !mutationMetaOperation) {
            metaListVariable = `${ this.mutateMetaListVarName }`;
        } else if (!this.mutateMetaVariableDeclared &&  mutationMetaOperation) {
            metaListVariable = `${ mutationMetaOperation }`;
            // Mark the mutateMeta variable as declared, meaning we can
            // add it to a new mutationMeta for the next WITH clause 
            this.mutateMetaVariableDeclared = true;
        } else if (!this.mutateMetaVariableDeclared && !mutationMetaOperation && !opts.declareMutateMeta) {
            metaListVariable = ``;
        } else if (!this.mutateMetaVariableDeclared && !mutationMetaOperation && opts.declareMutateMeta) {
            metaListVariable = `[]`;
            this.mutateMetaVariableDeclared = true;
        }

        if (mutationMetaOperation || opts.declareMutateMeta) {
            metaListVariable = `${ metaListVariable } as ${ this.mutateMetaListVarName }`;
        }

        return metaListVariable;
    }
}

export default WithProjector;
