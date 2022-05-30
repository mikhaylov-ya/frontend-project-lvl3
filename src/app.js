import * as yup from 'yup';
import i18n from 'i18next';
import axios from 'axios';
import watcher from './watcher.js';
import parse from './parser.js';
import ru from './locales/ru.js';

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
      pubDate: new Date(pubDate.textContent),
      postId: index,
    };
  });
};

const extractFeed = (doc) => {
  const feedTitle = doc.querySelector('channel > title');
  const feedDescription = doc.querySelector('channel > description') ?? document.createElement('p');
  return { feedTitle, feedDescription };
};

const createProxy = (link) => {
  const proxy = new URL('https://allorigins.hexlet.app/get?');
  const params = proxy.searchParams;
  params.append('disableCache', true);
  // при вызове encodeURIComponent с link ссылка не собирается и парсер падает с ошибкой
  params.append('url', link);
  return proxy;
};

export default () => {
  const state = {
    uiState: {
      form: {
        status: { isValid: {}, message: {} },
        // в message выводятся не только ошибки, успех тоже, поэтому имя поля верное
        disableSubmitBtn: true,
      },
      addingFeedProcess: '', // ready, processing, error
      readPosts: [],
      notReadPosts: [],
    },
    urls: [],
    updatingFeed: false,
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

  const urlSchema = yup.string().url().required();
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
  const watchedState = watcher(state, containers);
  watchedState.addingFeedProcess = 'ready';

  const updateFeeds = (urls, getFeed) => {
    console.log('Updating your feed!');
    Promise.all(urls.map((url) => getFeed(url)))
      .then((docs) => {
        const updatedPostList = docs.map((doc) => extractPosts(doc)).flat();
        const newPosts = updatedPostList.filter((post) => !state.data.posts
          .some((postInState) => post.title === postInState.title));
        return newPosts.length > 0 ? watchedState.data.posts.push(...newPosts) : null;
      });

    setTimeout(() => updateFeeds(state.urls, getFeed), 5000);
  };

  containers.form.addEventListener('submit', (e) => {
    watchedState.addingFeedProcess = 'processing';
    // watchedState.uiState.form.disableSubmitBtn = true;

    // я знаю про FormData, но решил без лишних прокладок извлечь этот элемент из формы
    const input = e.target.elements.url;
    const val = input.value;

    e.preventDefault();
    urlSchema.notOneOf(state.urls).validate(val, { abortEarly: true })
      .then(() => {
        const query = (value, userReq = false) => axios.get(createProxy(value), { timeout: 10000 })
          .then((response) => {
            const content = response.data.contents;
            const streamContent = parse(content);

            // меняем стейт только при запросе от пользователя, но не при автообновлении фида
            if (userReq) {
              // watchedState.uiState.form.disableSubmitBtn = false;
              state.urls.push(input.value);
              watchedState.uiState.form.status = {
                isValid: true,
                message: i18nInst.t('validation.success'),
              };
            }
            return streamContent;
          })
          .catch((er) => {
            // Тут ловим сетевую ошибку или ошибку парсера
            watchedState.addingFeedProcess = 'error';
            watchedState.uiState.form.status = {
              isValid: false,
              message: i18nInst.t(er.message === 'errors.parser' ? er.message : 'errors.network'),
            };
            console.error(er.message);
            // watchedState.uiState.form.disableSubmitBtn = false;
          });

        query(val, true).then((rss) => {
          const { feedTitle, feedDescription } = extractFeed(rss);
          const posts = extractPosts(rss);

          const postsId = posts.map(({ postId }) => postId);
          state.data.feeds.push({
            title: feedTitle.textContent,
            description: feedDescription.textContent,
          });
          state.uiState.notReadPosts.push(...postsId);
          watchedState.data.posts.push(...posts); // триггерим рендер
          watchedState.addingFeedProcess = 'ready';
          if (!state.updatingFeed) {
            setTimeout(() => updateFeeds(state.urls, query), 5000);
            state.updatingFeed = true;
          }
        });
      })
      // Здесь ловим ошибки валидации yup
      .catch((er) => {
        console.error(er);
        e.stopPropagation();
        watchedState.addingFeedProcess = 'error';
        watchedState.uiState.form.status = {
          isValid: false,
          message: i18nInst.t(er.errors.toString()),
        };
      });
  }, false);
};
