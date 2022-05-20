export default (html, state) => {
  const feedTitle = html.querySelector('channel > title');
  const feedDescription = html.querySelector('channel > description') ?? document.createElement('p');

  const items = html.querySelectorAll('item');
  const posts = [...items].map((item, index) => {
    const title = item.firstElementChild;
    const pubDate = item.querySelector('pubDate');
    // Некоторые RSS не содержат эл-нт description (напр у Ведомостей или Investing.com), и чтобы
    // не ломать их парсинг (а его реализация зависит от браузера), мы создадим пустышку
    const description = item.querySelector('description') ?? document.createElement('p');
    const link = item.querySelector('link');
    return {
      title: title.textContent,
      description: description.textContent,
      link: link.textContent,
      pubDate: new Date(pubDate.textContent),
      postId: index,
    };
  });
  // Проверяем, загружали ли мы уже этот поток ранее
  if (state.data.feeds.some((feed) => feed.title === feedTitle.textContent)) {
    // Тут хитро - в some сравниваем посты в стейте и посты из нынешней выгрузки
    // отфильтровываем только посты, которых нет в стейте - то есть новые посты
    const newPosts = posts.filter((post) => !state.data.posts
      .some((postInState) => post.title === postInState.title));

    return newPosts.length > 0 ? state.data.posts.push(...newPosts) : null;
  }

  const postsReadState = posts.map(({ postId }) => ({ postId, isRead: false }));
  state.uiState.posts.push(...postsReadState);
  state.data.feeds.push({
    title: feedTitle.textContent,
    description: feedDescription.textContent,
  });
  state.data.posts.push(...posts);
  return null;
};
