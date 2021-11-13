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
    ConnectedMutationMeta |
    DisconnectedMutationMeta |
    DeletedMutationMeta |
    CreatedMutationMeta
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
    type: 'RelationshipUpdated',
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
export interface DisconnectedMutationMeta extends MutationMeta {
    type: 'Disconnected',
    toID: Integer;
    toName: string;
    relationshipName: string;
    relationshipID: Integer;
}
export interface CreatedMutationMeta extends MutationMeta {
    type: 'Created',
    properties: any;
}
export interface DeletedMutationMeta extends MutationMeta {
    type: 'Deleted',
}

/**
 * Mutation Meta Variables
 * These are interfaces used with the `markMutationMeta` function
 */

export type MutationMetaVarsCommon =
    UpdatedMutationMetaVars |
    ConnectedMutationMetaVars |
    DisconnectedMutationMetaVars |
    RelationshipUpdatedMutationMetaVars |
    DeletedMutationMetaVars |
    CreatedMutationMetaVars
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
export interface DeletedMutationMetaVars extends MutationMetaVars {
    type: 'Deleted';
}

export interface CreatedMutationMetaVars extends MutationMetaVars {
    type: 'Created';
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

export interface DisconnectedMutationMetaVars extends MutationMetaVars {
    type: 'Disconnected';
    toIDVar: string;
    toName: string;
    relationshipName?: string;
    relationshipIDVar?: string;
}

export interface ConnectedMutationMetaVars extends MutationMetaVars {
    type: 'Connected';
    propertiesVar?: string;
    toIDVar: string;
    toName: string;
    relationshipName?: string;
    relationshipIDVar?: string;
}

export interface NextBlockOptions {
    declareMutateMeta?: boolean;
    simpleReferencesOnly?: boolean;
    excludeVariables?: string[];
    additionalMutateMeta?: string;
    additionalVariables?: string[];
    reduceMeta?: boolean;
}

export interface Projection {
    initialVariable?: string;
    outputVariable?: string;
    str?: string;
}

class WithProjector {
    
    public subName?: string;
    public variables: string[];
    public mutateMetaListVarName: string;
    public mutateMetaVariableDeclared = false;

    protected parent?: WithProjector;
    protected mutationMeta: MutationMetaVarsCommon[] = [];

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
        if (this.variables.includes(variableName)) { return; }
        this.variables.push(variableName);
    }

    removeVariable(variableName: string) {
        const index = this.variables.indexOf(variableName);
        if (index >= 0) {
            this.variables.splice(index, 1);
        }

    }

    /**
     * Used as a variable in a return function
     * @returns `metaList as metaList`, `metaList + [ { id: _id, ... } ]` or empty string
     */
    nextReturn(projections: Projection[] = [], opts: NextBlockOptions = {}) {
        // eslint-disable-next-line no-param-reassign
        opts.excludeVariables = [ ...(opts.excludeVariables || []) ];
        for (const projection of projections) {
            if (projection.initialVariable) {
                opts.excludeVariables.push(projection.initialVariable);
            }
            if (projection.outputVariable) {
                opts.excludeVariables.push(projection.outputVariable);
            }
        }

        const returnVars = this.nextBlockVars(opts);
        for (const p of projections) {
            let pOut = `${ p.initialVariable || '' } ${ p.str }`;
            if (p.outputVariable || p.initialVariable) {
                pOut += ` AS ${ p.outputVariable || p.initialVariable }`;
            }

            returnVars.push(pOut);
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

        if (opts.additionalVariables) {
            vars.push(...opts.additionalVariables);
        }

        const metaListVariable = this.generateMetaListVariable(opts);

        // Only add this variable if we need it
        if (metaListVariable !== '') {
            vars.push(metaListVariable);
        }

        return vars;
    }

    markMutationMeta(mutationMeta: MutationMetaVarsCommon) {
        this.mutationMeta.push(mutationMeta);

    }

    createChild(subName?: string) {
        const childWithProjector = new WithProjector({
            subName,
            variables: [ ...this.variables ],
        });
        childWithProjector.parent = this;

        return childWithProjector;
    }

    mergeWithChild(child: WithProjector, childVarName = child.mutateMetaListVarName) {
        if (!child) { return ''; }
        if (this.mutateMetaListVarName === childVarName) { return ''; }

        const withVars = this.nextBlockVars({
            additionalMutateMeta: childVarName,
        });

        return `WITH ${ withVars.join(', ') }`;
    }

    private generateMetaListVariable(opts: NextBlockOptions = {}) {

        // Skip operation if we can only use simple references
        if (opts.simpleReferencesOnly) {
            return this.mutateMetaVariableDeclared ? this.mutateMetaListVarName : '';
        }

        // WITH new metaInfo object
        let mutationMetaOperation: string | undefined;
        if (this.mutationMeta.length > 0) {
            const metaVals: string[] = [];
            for (const meta of this.mutationMeta) {
                const props: string[] = [];
                const literalKeys = Object.keys(meta).filter((k) => !k.endsWith('Var'));
                literalKeys.forEach((propName) => {
                    if (!meta) { return; }
                    const literal = meta[propName];
                    if (!literal) { return; }
                    props.push(`${ propName }: '${ literal }'`);
                });
    
                const varKeys = Object.keys(meta).filter((k) => k.endsWith('Var'));
                varKeys.forEach((varNameKey) => {
                    if (!meta) { return; }
                    const propName = varNameKey.replace('Var', '');
                    const varName = meta[varNameKey];
                    if (!varName) { return; }
                    props.push(`${ propName }: ${ varName }`);
                });
    
                metaVals.push(`{${ props.join(', ') }}`);
            }
            
            const metaWhere = [
                `metaVal IS NOT NULL`,
                `metaVal.id IS NOT NULL`,
                `(metaVal.toID IS NOT NULL OR metaVal.toName IS NULL)`,
            ];

            if (metaVals.length) {
                mutationMetaOperation = `[ metaVal IN [${ metaVals.join(',') }] WHERE ${ metaWhere.join(' AND ') } ]`;
            }
            this.mutationMeta = [];
        }

        let metaListVariable = '';
        let doAlias = false;
        if        ( this.mutateMetaVariableDeclared &&  mutationMetaOperation) {
            metaListVariable = `${ this.mutateMetaListVarName } + ${ mutationMetaOperation }`;
            doAlias = true;
        } else if ( this.mutateMetaVariableDeclared && !mutationMetaOperation) {
            metaListVariable = `${ this.mutateMetaListVarName }`;
        } else if (!this.mutateMetaVariableDeclared &&  mutationMetaOperation) {
            metaListVariable = `${ mutationMetaOperation }`;
            doAlias = true;
        } else if (!this.mutateMetaVariableDeclared && !mutationMetaOperation && !opts.declareMutateMeta) {
            metaListVariable = ``;
        } else if (!this.mutateMetaVariableDeclared && !mutationMetaOperation && opts.declareMutateMeta) {
            metaListVariable = `[]`;
            doAlias = true;
        }


        if (opts.additionalMutateMeta) {
            if (metaListVariable === '') {
                metaListVariable = opts.additionalMutateMeta;
            } else {
                metaListVariable = `${ metaListVariable } + ${ opts.additionalMutateMeta }`;
            }
            doAlias = true;
        }

        if (opts.reduceMeta && (doAlias || this.mutateMetaVariableDeclared)) {
            const tempVar1 = `tmp1_${ this.mutateMetaListVarName }`;
            const tempVar2 = `tmp2_${ this.mutateMetaListVarName }`;

            metaListVariable = `REDUCE(${ tempVar1 } = [], ${ tempVar2 } IN COLLECT(${ metaListVariable }) | ${ tempVar1 } + ${ tempVar2 })`;
            doAlias = true;
        }

        if (doAlias) {
            metaListVariable = `${ metaListVariable } as ${ this.mutateMetaListVarName }`;
            // Mark the mutateMeta variable as declared, meaning we can
            // add it to a new mutationMeta for the next WITH clause 
            this.mutateMetaVariableDeclared = true;
        }

        return metaListVariable;
    }
}

export default WithProjector;
