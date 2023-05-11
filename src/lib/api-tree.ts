import {OpenAPIV2, OpenAPIV3, OpenAPIV3_1} from "openapi-types";

type PathItemObject = OpenAPIV2.PathItemObject | OpenAPIV3.PathItemObject |OpenAPIV3_1.PathItemObject;

enum HttpMethods {
    GET = "get",
    PUT = "put",
    POST = "post",
    DELETE = "delete",
    OPTIONS = "options",
    HEAD = "head",
    PATCH = "patch"
}

const MethodsColorMap = {
    [HttpMethods.OPTIONS]: '#Gray',
    [HttpMethods.HEAD]: '#SteelBlue',
    [HttpMethods.GET]: '#lightblue',
    [HttpMethods.POST]: '#lightgreen',
    [HttpMethods.PATCH]: '#Turquoise',
    [HttpMethods.PUT]: '#orange',
    [HttpMethods.DELETE]: '#FFBBCC',
}

const METHODS: ReadonlyArray<HttpMethods> = [
    HttpMethods.OPTIONS,
    HttpMethods.HEAD,
    HttpMethods.GET,
    HttpMethods.POST,
    HttpMethods.PATCH,
    HttpMethods.PUT,
    HttpMethods.DELETE,
];

class Path {
    children: Map<string, Path> = new Map();
    constructor(readonly name: string, readonly depth: number, readonly pathItem?: PathItemObject) {
    }
}

export class APITree {
    private root = new Path('API', 0);

    add(fullPath: string, pathItem: PathItemObject): void {
        let parent = this.root;
        const components = fullPath.split('/').filter(c => !!c.trim());
        let component = components.shift();
        while (component) {
            const exist = parent.children.get(component);
            if (!exist) {
                const path = new Path(`${component}`, parent.depth + 1, components.length === 0 ? pathItem : undefined);
                parent.children.set(component, path);
                parent = path;
            } else {
                parent = exist;
            }
            component = components.shift();
        }
    }

    toString(): string {
        let str = '@startmindmap\n';
        const _toString = (path: Path) => {
            const d = (new Array(path.depth + 1)).fill('*').join('');
            let name = '';
            if (/^\{.+}$/.test(path.name)) {
                name = `/<b>${path.name}</b>`
            } else {
                name = `/${path.name}`
            }
            str += `${d} ${name}\n`;
            if (path.children.size) {
                Array.from(path.children.values()).forEach(p => _toString(p));
            }
            METHODS.forEach(method => {
                if (path.pathItem && path.pathItem[method]) {
                    str += `${d}*[${MethodsColorMap[method]}] ${method.toUpperCase()}\n`;
                    str += `${d}**_ ${path.pathItem[method]?.summary}\n`;
                }
            })
        }
        _toString(this.root);
        str += '@endmindmap\n';
        return str;
    }

    print(): void {
        console.log(this.toString());
    }

}
