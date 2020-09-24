// '[Movie]' becomes 'Movie' & 'Movie!' becomes 'Movie'
function removeTypeMeta(str: string): string {
    return str.replace(/\[/g, "").replace(/\]/g, "").replace(/!/g, "");
}

export default removeTypeMeta;
