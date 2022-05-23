import GraphQLServerApi from "./graphql-server-api";

let wsUrl = "ws://localhost:4000/graphql";
const url = "/graphql";

console.log("Url:", url);
console.log("WS Url:", wsUrl);
const serverApi = new GraphQLServerApi({
    url,
    wsUrl,
});


function createMovieRow(movie) {
    const row = document.createElement("tr");


    const cell1 = createCell(movie, "title", false);
    row.appendChild(cell1);
    const cell2 = createCell(movie, "tagline", true);
    row.appendChild(cell2);
    const cell3 = createCell(movie, "released", true, true);
    row.appendChild(cell3);
    return row
}

function createCell(movie, field = "", editable = true, isNumber = false) {
    const cell = document.createElement("td");
    cell.classList.add(`${field}-cell`);
    cell.setAttribute("contenteditable", editable)
    cell.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") {
            ev.preventDefault();
            ev.target.blur()
        }
    });

    cell.addEventListener("blur", (ev) => {
        serverApi.updateMovie(movie.title, field, isNumber ? Number(ev.target.innerText) : ev.target.innerText);
    });

    cell.innerText = movie[field];
    return cell
}

const insertRow = document.getElementById("insert-row");
const movieTable = document.getElementById("movie-table");

async function main() {
    const movies = await serverApi.getMovies()
    for (const movie of movies) {
        const row = createMovieRow(movie)
        movieTable.appendChild(row);
        serverApi.onMovieUpdate(movie.title, ({
            updatedMovie
        }) => {
            const taglineCell = row.querySelector(".tagline-cell")
            const releasedCell = row.querySelector(".released-cell")
            taglineCell.innerText = updatedMovie.tagline;
            releasedCell.innerText = updatedMovie.released;
        })

    }
}


main()
