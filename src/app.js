import * as yup from 'yup';
import i18n from 'i18next';
import axios from 'axios';
import watcher from './watcher.js';
import parse from './parser.js';
import ru from './locales/ru.js';

const createProxy = (link) => {
  const proxy = new URL('https://allorigins.hexlet.app/get?');
  const params = proxy.searchParams;
  params.append('disableCache', true);
  // при вызове encodeURIComponent с link ссылка не собирается и парсер падает с ошибкой
  params.append('url', link);
  return proxy;
};

const validate = (state, val) => {
  const urlSchema = yup.string().url().required();
  return urlSchema.notOneOf(state.urls).validate(val, { abortEarly: true });
};

const updateFeeds = (state) => {
  console.log('Updating your feed!');
  Promise.all(state.urls.map((url) => {
    axios.get(createProxy(url))
      .then((response) => {
        const content = response.data.contents;
        const { posts } = parse(content);
        return posts;
      })
      .then((updatedPostList) => {
        const newPosts = updatedPostList.filter((post) => !state.data.posts
          .some((postInState) => post.title === postInState.title));
        return newPosts.length > 0
          ? state.data.posts.push(...newPosts) : console.log('No new posts');
      })
      .catch((er) => console.error(er));
    return null;
  }));

  setTimeout(() => updateFeeds(state), 5000);
};

export default () => {
  const state = {
    uiState: {
      form: {
        message: '',
      },
      addingFeedProcess: '', // ready, processing, error
      readPosts: [],
      notReadPosts: [],
    },
    urls: [],
    data: {
      posts: [],
      feeds: [],
    },
  };

  const i18nInst = i18n.createInstance();
  i18nInst.init({
    lng: 'ru',
    debug: false,
    resources: { ru },
  });

  yup.setLocale({
    string: {
      url: 'validation.wrongUrl',
    },
    mixed: {
      notOneOf: 'validation.duplicate',
      required: 'validation.empty',
    },
  });

  const containers = {
    feeds: document.querySelector('.feeds'),
    postContainer: document.querySelector('.posts'),
    feedback: document.querySelector('.feedback'),
    form: document.querySelector('form'),
    submitBtn: document.querySelector('form button[type="submit"]'),
    modalTitle: document.querySelector('.modal-title'),
    modalDescription: document.querySelector('.modal-body > p'),
    modalLink: document.querySelector('.modal-link'),
  }; // Контейнеры извлекаем один раз при инициализации, а не при каждом ререндере
  const watchedState = watcher(state, containers, i18nInst);
  watchedState.addingFeedProcess = 'ready';

  updateFeeds(watchedState);
  containers.form.addEventListener('submit', (e) => {
    watchedState.addingFeedProcess = 'processing';

    // я знаю про FormData, но решил без лишних прокладок извлечь этот элемент из формы
    const input = e.target.elements.url;
    const val = input.value;

    e.preventDefault();
    validate(state, val)
      .then(() => {
        const query = (value) => axios.get(createProxy(value), { timeout: 10000 })
          .then((response) => {
            const content = response.data.contents;
            const { posts, feed } = parse(content);
            state.urls.push(input.value);
            state.uiState.form.message = 'validation.success';
            watchedState.addingFeedProcess = 'ready';

            const postsId = posts.map(({ postId }) => postId);
            state.data.feeds.push({
              title: feed.feedTitle.textContent,
              description: feed.feedDescription.textContent,
            });
            state.uiState.notReadPosts.push(...postsId);
            watchedState.data.posts.push(...posts); // триггерим рендер
          })
          .catch((er) => {
            // Тут ловим сетевую ошибку или ошибку парсера
            state.uiState.form.message = er.message === 'errors.parser'
              ? er.message : 'errors.network';
            watchedState.addingFeedProcess = 'error';
            console.error(er.message);
          });

        query(val);
      })
      // Здесь ловим ошибки валидации yup
      .catch((er) => {
        console.error(er.message);
        e.stopPropagation();
        state.uiState.form.message = er.errors.toString();
        watchedState.addingFeedProcess = 'error';
      });
  }, false);
};
