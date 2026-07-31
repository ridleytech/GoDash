const MONGODB_URI = process.env.MONGODB_URI || "";
const MONGODB_DB = process.env.MONGODB_DB || "godash";

/** @type {import('mongodb').MongoClientConstructor | null} */
let MongoClient = null;
if (MONGODB_URI) {
  try {
    MongoClient = require("mongodb").MongoClient;
  } catch (_e) {
    MongoClient = null;
  }
}

/** @type {MongoClient | null} */
let client = null;
/** @type {import('mongodb').Collection | null} */
let groupsCollection = null;

/** @type {Map<string, any>} */
const memoryGroups = new Map();

async function getGroupsCollection() {
  if (!MONGODB_URI) return null;
  if (!MongoClient) return null;

  if (!client) {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
  }

  if (!groupsCollection) {
    const db = client.db(MONGODB_DB);
    groupsCollection = db.collection("groups");
  }

  return groupsCollection;
}

function normalizeFromDb(doc) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { id: String(_id), ...rest };
}

function toDbDoc(group) {
  const { id, ...rest } = group;
  return { _id: id, ...rest };
}

async function getGroup(id) {
  const col = await getGroupsCollection();
  if (!col) return memoryGroups.get(id) || null;
  const doc = await col.findOne({ _id: id });
  return normalizeFromDb(doc);
}

async function createGroup(group) {
  const col = await getGroupsCollection();
  if (!col) {
    memoryGroups.set(group.id, group);
    return;
  }
  await col.insertOne(toDbDoc(group));
}

async function saveGroup(group) {
  const col = await getGroupsCollection();
  if (!col) {
    memoryGroups.set(group.id, group);
    return;
  }
  await col.replaceOne({ _id: group.id }, toDbDoc(group), { upsert: true });
}

module.exports = {
  getGroup,
  createGroup,
  saveGroup,
};
