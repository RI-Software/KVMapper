import {Node} from './types/node';
import {NodeData} from './types/nodeData';
import {EqualityEnum} from './types/equalityEnum';

export class Mapper {
  private init: object = null;
  private cur: object[] = null;
  private result: Node = null;
  private curNodeRoot: Node = null;
  private curNodeTail: Node[] = [];

  private static parse(obj, key: string): Node {
    const result: Node = new Node();
    result.type = key;
    for (const k of Object.keys(obj)) {
      const fieldType: string = typeof obj[k];
      if (fieldType !== 'object') {
        const data: NodeData = new NodeData();
        data.key = k;
        data.value = obj[k];
        result.value.push(data);
      }
    }
    return result;
  }

  private static parseArray(arr: any[], property: string): Node {
    const rootNode: Node = new Node();
    rootNode.type = property;
    for (const item of arr) {
      const parsedItem = Mapper.parse(item, property + '-item');
      rootNode.nodes.push(parsedItem);
    }

    return rootNode;
  }

  private static merge(to: Node, from: Node): void {
    if (to.includedOrEqual(from) === EqualityEnum.Different) {
      return;
    }

    for (const node of to.nodes) {
      const fr = from.nodes.find(n => node.includedOrEqual(n) === EqualityEnum.Equal);
      if (fr) {
        this.merge(node, fr);
      }
    }

    const uniqueFromNodes = [];
    for (const node of from.nodes) {
      const t = to.nodes.filter(n => n.includedOrEqual(node) === EqualityEnum.Equal);

      if (t.length === 0) {
        uniqueFromNodes.push(node);
      }
    }

    to.nodes.push(...uniqueFromNodes);
  }

  private reset(from: object, rootType: string): void {
    if (Array.isArray(from)) {
      this.cur = [...from];
      this.curNodeRoot = Mapper.parseArray(from, rootType);
      this.curNodeTail = this.curNodeRoot.nodes;
    } else {
      this.cur = [from];
      this.curNodeRoot = Mapper.parse(from, rootType);
      this.curNodeTail = [this.curNodeRoot];
    }
  }

  public include(property: string): this {
    Mapper.merge(this.result, this.curNodeRoot);
    this.reset(this.init, this.curNodeRoot.type);
    this.thenInclude(property);
    return this;
  }

  public thenInclude(property: string): this {
    const newTail: Node[] = [];
    const newCur: object[] = [];

    for (let i = 0; i < this.cur.length; i++) {
      const obj = this.cur[i][property];
      if (!obj) {
        continue;
      }
      let parsedChild: Node = null;

      if (Array.isArray(obj)) {
        parsedChild = Mapper.parseArray(obj, property);
        newTail.push(...parsedChild.nodes);
        newCur.push(...obj);
      } else {
        parsedChild = Mapper.parse(obj, property);
        newTail.push(parsedChild);
        newCur.push(obj);
      }

      this.curNodeTail[i].nodes.push(parsedChild);
    }

    this.cur = newCur;
    this.curNodeTail = newTail;
    return this;
  }

  public begin(from: object, rootType: string): this {
    if (Array.isArray(from)) {
      this.result = Mapper.parseArray(from, rootType);
    } else {
      this.result = Mapper.parse(from, rootType);
    }
    this.init = from;
    this.reset(from, rootType);

    return this;
  }

  public finish(): Node {
    Mapper.merge(this.result, this.curNodeRoot);
    return this.result;
  }
}

export class ReCreator {
  private static nodeIsArray(node: Node): boolean {
    if (node.value.length !== 0) {
      return false;
    }

    const nodeType: string = node.type + '-item';

    const children = node.nodes.filter(n => n.type === nodeType);

    return !(children.length === 0 || children.length !== node.nodes.length);
  }

  public static recreate<T>(node: Node,
                            idPropName: string = "id",
                            updatedAtPropName: string = "updatedAt",
                            createdAtPropName: string = "createdAt"): T {
    let result: unknown = {};
    for (const v of node.value) {
      result[v.key] = v.value;
    }

    if (this.nodeIsArray(node)) {
      const arr = [];
      for (const n of node.nodes) {
        arr.push(ReCreator.recreate(n, idPropName, updatedAtPropName, createdAtPropName));
      }
      result = arr;
    } else {
      // ToDo: pass strings as settings
      result[createdAtPropName] = node.createdAt;
      result[updatedAtPropName] = node.updatedAt;
      result[idPropName] = node.id;
      // end;

      for (const n of node.nodes) {
        result[n.type] = ReCreator.recreate(n, idPropName, updatedAtPropName, createdAtPropName);
      }
    }

    return result as T;
  }
}
