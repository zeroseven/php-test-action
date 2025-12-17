import { XMLParser, XMLBuilder } from 'fast-xml-parser';

const parserOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseAttributeValue: true,
  parseTagValue: true,
  trimValues: true,
};

export function parseXML<T = any>(xmlContent: string): T {
  const parser = new XMLParser(parserOptions);
  return parser.parse(xmlContent) as T;
}

export function buildXML(obj: any): string {
  const builder = new XMLBuilder(parserOptions);
  return builder.build(obj);
}

export function safeParseXML<T = any>(xmlContent: string): T | null {
  try {
    return parseXML<T>(xmlContent);
  } catch (error) {
    return null;
  }
}
