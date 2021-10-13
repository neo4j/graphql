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

export interface WithProjectorConstructor {
    variables?: string[];
    mutateMetaListVarName?: string;

}

export type MutationMetaType =  'Updated' | 'Created' | 'Deleted' | 'Connected' | 'Disconnected' | 'RelationshipUpdated';

export interface MutationMeta {
    id: number;
    name: string;
    type: MutationMetaType;
}

export interface MutationMetaVars {
    idVar: string;
    name: string;
    type: MutationMetaType;

}

interface MutationMetaRelationshipVars {
    toIDVar: string;
    toName: string;
    relationshipName: string;
    relationshipIDVar: string;
}

export interface UpdatedMutationMetaVars extends MutationMetaVars {
    type: 'Updated';
    properties: any;
}
export interface RelationshipUpdatedMutationMetaVars extends MutationMetaVars, MutationMetaRelationshipVars {
    type: 'RelationshipUpdated';
    properties: any;
}

type MetaVars = UpdatedMutationMetaVars | RelationshipUpdatedMutationMetaVars;

class WithProjector {
    
    public variables: string[];
    public mutateMetaListVarName: string;
    public mutateMetaVariableDeclared = false;

    protected parent?: WithProjector;
    protected mutationMeta?: MutationMetaVars;

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

    markMutationMeta(mutationMeta: MetaVars) {
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
        if (this.mutateMetaVariableDeclared) {
            metaListVariable = `${ this.mutateMetaListVarName }`;
        }

        // WITH new metaInfo object
        if (this.mutationMeta) {
            const props = [
                `type: "${ this.mutationMeta.type }"`,
                `id: ${ this.mutationMeta.idVar }`,
                `name: "${ this.mutationMeta.name }"`,
            ];
            const metaInfo = `{${ props.join(', ') }}`;
            metaListVariable += `${ this.mutateMetaVariableDeclared ? ' + ' : '' } [ ${ metaInfo } ]`;
        }

        // WITH as metaInfo array
        if (this.mutateMetaVariableDeclared || this.mutationMeta) {

            // Remove nulls
            metaListVariable = `[val in (${ metaListVariable }) WHERE val IS NOT NULL AND val.id IS NOT NULL]`;

            // Alias metaListVariable
            metaListVariable += ` as ${ this.mutateMetaListVarName }`;

            // Mark the mutateMeta variable as declared, meaning we can
            // add it to a new mutationMeta for the next WITH clause 
            this.mutateMetaVariableDeclared = true;
        }

        return metaListVariable;
    }
}

export default WithProjector;
