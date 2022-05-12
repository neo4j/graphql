const neo4j = require('neo4j-driver');


module.exports = async function setupMap(size) {
    const driver = neo4j.driver(
        'neo4j://localhost',
        neo4j.auth.basic('neo4j', 'dontpanic42')
    )
    const session = driver.session();
    let index=0;
    for(let i=0; i<size; i++){
        for(let j=0; j<size; j++){
            const statement=mergePixelStatement(index, [i,j]);
            await session.run(statement);
            index++;
        }
    }
    await session.close();
    await driver.close()
}


function mergePixelStatement(index,position, color="#FFFFFF"){
    return `MERGE(p${index}:Pixel { position: [${position.join(",")}]})
        ON CREATE SET p${index}.color="${color}"`
}
