const addPosts = (html, state) => {
  const items = html.querySelectorAll('item');
  items.forEach((item) => {
    const title = item.firstElementChild;
    const pubDate = item.querySelector('pubDate');
    const description = item.querySelector('description');
    const link = item.querySelector('link');
    state.form.data.posts.push({
      title: title.textContent,
      description: description.textContent,
      link: link.textContent,
      pubDate: pubDate.textContent,
    });
  });
};

const addFeed = (html, state) => {
  const title = html.querySelector('title');
  const description = html.querySelector('description');
  state.form.data.feeds.push({
    title: title.textContent,
    description: description.textContent,
  });
};

export { addFeed, addPosts };
