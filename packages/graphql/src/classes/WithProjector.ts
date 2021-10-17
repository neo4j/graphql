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

}

export type MutationMetaType =  'Updated' | 'Created' | 'Deleted' | 'Connected' | 'Disconnected' | 'RelationshipUpdated';

export type MutationMetaCommon = UpdatedMutationMeta | RelationshipUpdatedMutationMeta;

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

export type MutationMetaVarsCommon = UpdatedMutationMetaVars | RelationshipUpdatedMutationMetaVars;

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

class WithProjector {
    
    public variables: string[];
    public mutateMetaListVarName: string;
    public mutateMetaVariableDeclared = false;

    protected parent?: WithProjector;
    protected mutationMeta?: MutationMetaVarsCommon;

    constructor(input: WithProjectorConstructor) {
        this.variables = input.variables || [];
        this.mutateMetaListVarName = input.mutateMetaListVarName || 'mutateMeta';
    }

    addVariable(variableName: string) {
        this.variables.push(variableName);
    }

    /**
     * Used as a variable in a return function
     * @returns `metaList as metaList`, `metaList + [ { id: _id, ... } ]` or empty string
     */
    nextReturn() {
        return this.generateMetaListVariable();
    }

    nextWith() {

        const withVars = [ ...this.variables ];

        const metaListVariable = this.generateMetaListVariable();

        // Only add this variable if we need it
        if (metaListVariable !== '') {
            withVars.push(metaListVariable);
        }

        // With may still be required, even though we are not passing any variables.
        // Will probably never happen
        if (withVars.length === 0) {
            return `WITH [] as _`;
        }

        return `WITH ${ withVars.join(', ') }`;
    }

    markMutationMeta(mutationMeta: MutationMetaVarsCommon) {
        this.mutationMeta = mutationMeta;

    }

    createChild() {
        const childWithProjector = new WithProjector({ variables: [ ...this.variables ] });
        childWithProjector.parent = this;

        return childWithProjector;
    }

    private generateMetaListVariable() {

        let metaListVariable = '';
        // WITH existing metaInfo array
        // if (this.mutateMetaVariableDeclared) {
            // metaListVariable = `${ this.mutateMetaListVarName }`;
        // }

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
        } else if (!this.mutateMetaVariableDeclared && !mutationMetaOperation) {
            metaListVariable = ``;
        }

        if (mutationMetaOperation) {
            metaListVariable = `${ metaListVariable } as ${ this.mutateMetaListVarName }`;
        }

        return metaListVariable;
    }
}

export default WithProjector;
