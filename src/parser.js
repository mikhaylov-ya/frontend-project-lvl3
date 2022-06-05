const extractPosts = (doc) => {
  const items = doc.querySelectorAll('item');
  return [...items].map((item, index) => {
    const title = item.firstElementChild;
    const pubDate = item.querySelector('pubDate');
    const description = item.querySelector('description') ?? document.createElement('p');
    const link = item.querySelector('link');
    return {
      title: title.textContent,
      description: description.textContent,
      link: link.textContent,
      pubDate: pubDate.textContent,
      postId: index,
    };
  });
};

const extractFeed = (doc) => {
  const feedTitle = doc.querySelector('channel > title');
  const feedDescription = doc.querySelector('channel > description') ?? document.createElement('p');
  return { feedTitle, feedDescription };
};

export default (content) => {
  const parser = new DOMParser();
  const streamContent = parser.parseFromString(content, 'application/xml');
  const parserError = streamContent.querySelector('parsererror');
  if (parserError !== null) {
    throw new Error('errors.parser');
  }
  const rssTree = streamContent.documentElement;
  const posts = extractPosts(rssTree);
  const feed = extractFeed(rssTree);
  return { posts, feed };
};
