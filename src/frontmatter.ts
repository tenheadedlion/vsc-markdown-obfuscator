import { createToken, Lexer, CstParser, tokenMatcher, EOF } from "chevrotain";
import * as markdown from './markdown';
import * as YAML from 'yaml';


export function parse(data: string): any {
    return YAML.parse(data);
}