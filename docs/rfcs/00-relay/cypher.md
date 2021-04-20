# Cypher

> EdgesToReturn(_allEdges_, _before_, _after_, _first_, _last_)
>
> 1. Let _edges_ be the result of calling ApplyCursorsToEdges(_allEdges_, _before_, _after_).
> 2. If _first_ is set:
>     1. If _first_ is less than 0:
>         1. Throw an error.
>     2. If _edges_ has length greater than than _first_:
>         1. Slice _edges_ to be of length _first_ by removing edges from the end of _edges_.
> 3. If _last_ is set:
>     1. If _last_ is less than 0:
>         1. Throw an error.
>     2. If _edges_ has length greater than than _last_:
>         1. Slice _edges_ to be of length _last_ by removing edges from the start of _edges_.
> 4. Return _edges_.
>
> ApplyCursorsToEdges(_allEdges_, _before_, _after_)
>
> 1. Initialize _edges_ to be _allEdges_.
> 2. If _after_ is set:
>     1. Let _afterEdge_ be the edge in _edges_ whose _cursor_ is equal to the _after_ argument.
>     2. If _afterEdge_ exists:
>         1. Remove all elements of _edges_ before and including _afterEdge_.
> 3. If _before_ is set:
>     1. Let _beforeEdge_ be the edge in _edges_ whose _cursor_ is equal to the _before_ argument.
>     2. If _beforeEdge_ exists:
>         1. Remove all elements of _edges_ after and including _beforeEdge_.
> 4. Return _edges_.

With each step mapped into Cypher:

> EdgesToReturn(_allEdges_, _before_, _after_, _first_, _last_)
>
> 1. Let _edges_ be the result of calling ApplyCursorsToEdges(_allEdges_, _before_, _after_).
> 2. If _first_ is set:
>     1. If _first_ is less than 0:
>         1. Throw an error. (This will be handled before entering Cypher translation)
>     2. If _edges_ has length greater than than _first_:
>         1. Slice _edges_ to be of length _first_ by removing edges from the end of _edges_.
> 3. If _last_ is set:
>     1. If _last_ is less than 0:
>         1. Throw an error. (This will be handled before entering Cypher translation)
>     2. If _edges_ has length greater than than _last_:
>         1. Slice _edges_ to be of length _last_ by removing edges from the start of _edges_.
> 4. Return _edges_.
>
> ApplyCursorsToEdges(_allEdges_, _before_, _after_)
>
> 1. Initialize _edges_ to be _allEdges_.
> 2. If _after_ is set:
>     1. Let _afterEdge_ be the edge in _edges_ whose _cursor_ is equal to the _after_ argument.
>     2. If _afterEdge_ exists:
>         1. Remove all elements of _edges_ before and including _afterEdge_.
> 3. If _before_ is set:
>     1. Let _beforeEdge_ be the edge in _edges_ whose _cursor_ is equal to the _before_ argument.
>     2. If _beforeEdge_ exists:
>         1. Remove all elements of _edges_ after and including _beforeEdge_.
> 4. Return _edges_.
