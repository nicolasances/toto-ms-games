import { Request } from "express";

export function extractAuthHeader(request: Request): string | null {

    if (request.headers["Authorization"]) return String(request.headers["Authorization"]);
    
    if (request.headers["authorization"]) return String(request.headers["authorization"]);

    return null;
}