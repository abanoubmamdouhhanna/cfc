export class ApiFeatures {
  constructor(mongooseQuery, queryData) {
    (this.mongooseQuery = mongooseQuery), (this.queryData = queryData);
  }

  paginate() {
    let { page, size } = this.queryData;
    if (!page || page <= 0) {
      page = 1;
    }
    if (!size || size <= 0) {
      size = 3;
    }
    if (size > 10) {
      size = 10;
    }

    const skip = (page - 1) * size;
    this.mongooseQuery.limit(size).skip(skip);
    return this;
  }

  filter() {
    let filterQuery = { ...this.queryData };

    const exclude = ["page", "size", "limit", "fields", "search", "sort"];
    exclude.forEach((key) => {
      if (filterQuery[key]) {
        delete filterQuery[key];
      }
    });
    filterQuery = JSON.parse(
      JSON.stringify(filterQuery).replace(
        /\b(gt|gte|lt|lte|in|nin|eq)\b/g,
        (match) => `$${match}`
      )
    );
    this.mongooseQuery.find(filterQuery);
    return this;
  }

  search() {
    if (this.queryData.search) {
      this.mongooseQuery.find({
        $or: [
          { name: { $regex: this.queryData.search, $options: "i" } },
          { description: { $regex: this.queryData.search, $options: "i" } },
        ],
      });
    }
    return this;
  }

  sort() {
    if (this.queryData.sort) {
      this.mongooseQuery.sort(this.queryData.sort.replaceAll(",", " "));
    }
    return this;
  }

  select() {
    if (this.queryData.fields) {
      this.mongooseQuery.select(this.queryData.fields.replaceAll(",", " "));
    }
    return this;
  }
}
