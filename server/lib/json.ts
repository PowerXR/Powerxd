export function parseJSON(value:any,fallback:any=[]){
    if(value==null)return fallback;
    if(Array.isArray(value)) return value;
    if(typeof value === 'object') return value;

    try{
        let parsed = JSON.parse(value);
        if (typeof parsed === "string") {
            return parseJSON(parsed, fallback);
        }
        return parsed;
    }catch{
        return fallback;
    }
}
