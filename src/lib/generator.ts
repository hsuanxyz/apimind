import * as SwaggerParser from "@apidevtools/swagger-parser"
import {OpenAPI} from "openapi-types";
import {APITree} from "./api-tree";

export const generator = async (def: unknown): Promise<APITree | undefined> => {
    try {
        let api = await SwaggerParser.validate(def as OpenAPI.Document, { parse: { yaml: true } });
        console.log("'API name: %s, Version: %s", api.info.title, api.info.version);
        if (api.paths) {
            const tree = new APITree();
            Object.keys(api.paths).forEach(key => {
                if(api.paths?.[key]) {
                    tree.add(key, api.paths[key]!)
                }
            })
            return tree;
        } else {
            console.warn("No paths found in the API definition");
            return undefined;
        }
    }
    catch(err) {
        console.error(err);
    }
    return undefined;
}

