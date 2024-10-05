export type DynamoEntry = {
    id: string,
    userId: string,
    // timestamp in seconds
    lastModified: number,
    title: string,
    description: string,
}

export type LastEvaluatedKey = {
    id: string,
    userId: string,
    lastModified: number,
}