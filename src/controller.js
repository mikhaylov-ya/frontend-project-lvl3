export default (html, state) => {
  const feedTitle = html.querySelector('channel > title');
  const feedDescription = html.querySelector('channel > description') ?? document.createElement('p');

  const items = html.querySelectorAll('item');
  const posts = [...items].map((item) => {
    const title = item.firstElementChild;
    const pubDate = item.querySelector('pubDate');
    // Некоторые RSS не содержат эл-нт description (напр у Ведомостей или Investing.com), и чтобы
    // не ломать их отображение, мы сделаем его пустым
    const description = item.querySelector('description') ?? document.createElement('p');
    const link = item.querySelector('link');
    return {
      title: title.textContent,
      description: description.textContent,
      link: link.textContent,
      pubDate: new Date(pubDate.textContent),
    };
  });
  // Проверяем, загружали ли мы уже этот поток ранее
  if (state.form.data.feeds.some((feed) => feed.title === feedTitle.textContent)) {
    // Тут хитро - в some сравниваем посты в стейте и посты из нынешней выгрузки
    // отфильтровываем только посты, которых нет в стейте - то есть новые посты
    const newPosts = posts.filter((post) => !state.form.data.posts
      .some((postInState) => post.title === postInState.title));

    state.form.data.posts.push(...newPosts);
    return;
  }

  state.form.data.feeds.push({
    title: feedTitle.textContent,
    description: feedDescription.textContent,
  });

  state.form.data.posts.push(...posts);
};
