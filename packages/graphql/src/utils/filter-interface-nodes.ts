/**
 *
 * We want to project implementation if there is either:
 *   * No where input
 *   * There is at least one root filter in addition to _on
 *   * There is no _on filter
 *   * _on is the only filter and the current implementation can be found within it
 */
const filterInterfaceNodes = ({ node, whereInput }) =>
    !whereInput ||
    Object.keys(whereInput).length > 1 ||
    !Object.prototype.hasOwnProperty.call(whereInput, "_on") ||
    (Object.keys(whereInput).length === 1 && Object.prototype.hasOwnProperty.call(whereInput._on, node.name));

export default filterInterfaceNodes;
