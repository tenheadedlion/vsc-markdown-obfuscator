import { createToken, Lexer, CstParser, CstNode } from 'chevrotain';
import * as fs from 'fs';
//import * as path from 'path';
//import * as url from 'url';

export enum BlockType {
    listBlock,
    nonListBlock,
    frontmatter,
    nonBlock
}

export type Block = {
    type: BlockType,
    content: Array<string>
};

const hr = createToken({ name: 'horizontalRule', pattern: /----*/ });
const line = createToken({ name: 'line', pattern: /.+/ });
const listEntry = createToken({ name: 'listEntry', pattern: /[-][^\S\r\n].*/ });
const newline = createToken({ name: 'newline', pattern: /\r?\n+/, group: Lexer.SKIPPED });

const allTokens = [
    hr,
    newline,
    listEntry,
    line,
];

function getParser(): any {

    class ExcerptParser extends CstParser {
        constructor() {
            super(allTokens);
            this.performSelfAnalysis();
        }
        public markdown = this.RULE('markdown', () => {
            this.SUBRULE(this.blocks, { LABEL: 'blocks' });
        }
        );

        private blocks = this.RULE('blocks', () => {
            this.MANY(() => this.SUBRULE(this.block, { LABEL: 'blockList' }));
        });

        private block = this.RULE('block', () => {
            this.OR([
                { ALT: () => this.SUBRULE(this.nonListBlock) },
                { ALT: () => this.SUBRULE(this.listBlock) },
                { ALT: () => this.SUBRULE(this.frontmatter) },
            ]);
        });

        private frontmatter = this.RULE('frontmatter', () => {
            this.CONSUME(hr, { LABEL: 'first_hr' });
            this.MANY(
                () => {
                    this.CONSUME2(line, { LABEL: 'matters' });
                }
            );
            this.CONSUME3(hr, { LABEL: 'last_hr' });
        });

        private listBlock = this.RULE('listBlock', () => {
            this.CONSUME(listEntry, { LABEL: 'first' });
            this.MANY(
                () => {
                    this.CONSUME2(listEntry, { LABEL: 'follow' });
                }
            );
        });

        private nonListBlock = this.RULE('nonListBlock', () => {
            this.CONSUME(line, { LABEL: 'first' });
            this.MANY(
                () => {
                    this.CONSUME2(line, { LABEL: 'follow' });
                }
            )
        });

    }
    const parser = new ExcerptParser();
    return parser;

}


function getLexer(): any {
    const lexer = new Lexer(allTokens);
    return lexer;
}

function getInterpreter(parser: CstParser): any {
    const excerptVisitor = parser.getBaseCstVisitorConstructor();
    class ExceptInterpreter extends excerptVisitor {
        constructor() {
            super();
            this.validateVisitor();
        }
        markdown(ctx: any): Array<Block> {
            console.log("visiting markdown");
            return this.visit(ctx.blocks);
        }
        blocks(ctx: any): Array<Block> {
            console.log("visiting blocks");
            const blocks: Array<Block> = [];
            ctx.blockList.forEach((element: any) => {
                blocks.push(this.visit(element));
            });
            return blocks;
        }

        block(ctx: any): Block {
            console.log("visiting block");
            if (ctx.listBlock) {
                return { type: BlockType.listBlock, content: this.visit(ctx.listBlock)};                
            } else if (ctx.nonListBlock) {
                return { type: BlockType.nonListBlock, content: this.visit(ctx.nonListBlock) };
            } else if (ctx.frontmatter) {
                return { type: BlockType.frontmatter, content: this.visit(ctx.frontmatter) };
            }
            return { type: BlockType.nonBlock, content: [] };
        }

        frontmatter(ctx: any): Array<string> {
            const lineArr: Array<string> = [];
            lineArr.push(ctx.first_hr[0].image);
            if (ctx.matters) {
                ctx.matters.forEach((element: { image: string; }) => {
                    lineArr.push(element.image);
                });
            }
            lineArr.push(ctx.last_hr[0].image);
            return lineArr;
        }

        listBlock(ctx: any): Array<string> {
            const lineArr: Array<string> = [];
            lineArr.push(ctx.first[0].image);
            if (ctx.follow) {
                ctx.follow.forEach((element: { image: string; }) => {
                    lineArr.push(element.image);
                });
            }
            return lineArr;
        }

        nonListBlock(ctx: any): Array<string> {
            const lineArr: Array<string> = [];
            lineArr.push(ctx.first[0].image);
            if (ctx.follow) {
                ctx.follow.forEach((element: { image: string; }) => {
                    lineArr.push(element.image);
                });
            }
            return lineArr;
        }
    }
    const interpreter = new ExceptInterpreter();
    return interpreter;
}

export function parse(markdown: string): any {
    const lexingResult = getLexer().tokenize(markdown);
    const parser = getParser();
    parser.input = lexingResult.tokens;
    parser.reset();
    const interpreter = getInterpreter(parser);
    const cst = parser.markdown();
    if (parser.errors.length > 0) {
        console.log("parser.errors.length: " + parser.errors.length);
        return undefined;
    }
    return interpreter.visit(cst);
}
