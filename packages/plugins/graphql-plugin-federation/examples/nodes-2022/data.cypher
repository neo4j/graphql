CREATE OR REPLACE DATABASE products
CREATE OR REPLACE DATABASE reviews
CREATE OR REPLACE COMPOSITE DATABASE store
CREATE ALIAS store.products FOR DATABASE products
CREATE ALIAS store.reviews FOR DATABASE reviews

:use products

CREATE (:Product { id: "1", name: "Banana", price: 20 })
CREATE (:Product { id: "2", name: "Pineapple", price: 90 })
CREATE (:Product { id: "3", name: "Dragon fruit", price: 300 })
CREATE (:Product { id: "4", name: "Watermelon", price: 160 })
CREATE (:Product { id: "5", name: "Durian", price: 450 })

:use reviews

CREATE (banana:Product { id: "1" })
CREATE (pineapple:Product { id: "2" })
CREATE (dragonfruit:Product { id: "3" })
CREATE (watermelon:Product { id: "4" })
CREATE (durian:Product { id: "5" })

CREATE (:Review { score: 4, description: "So exotic, so expensive :')" })<-[:HAS_REVIEW]-(dragonfruit)
CREATE (:Review { score: 10, description: "Makes for a pretty good home for sponges and snails" })<-[:HAS_REVIEW]-(pineapple)
CREATE (:Review { score: 10, description: "BANANA!" })<-[:HAS_REVIEW]-(banana)
CREATE (:Review { score: 6, description: "Potato?" })<-[:HAS_REVIEW]-(banana)
CREATE (:Review { score: 10, description: "Ba-ba-ba ba-ba-bana" })<-[:HAS_REVIEW]-(banana)
CREATE (:Review { score: 10, description: "Ever wanted a fruit that smells like your dirty socks? You're in the right place!" })<-[:HAS_REVIEW]-(durian)
CREATE (:Review { score: 10, description: "There's sherbet in my home, made out of watermelone!" })<-[:HAS_REVIEW]-(watermelon)
CREATE (:Review { score: 10, description: "Was a bit disappointed that it didn't contain a real dragon" })<-[:HAS_REVIEW]-(dragonfruit)
CREATE (:Review { score: 7, description: "I've got watermeloooone to keep me in shape!" })<-[:HAS_REVIEW]-(watermelon)
CREATE (:Review { score: 1, description: "Bit stinky" })<-[:HAS_REVIEW]-(durian)
