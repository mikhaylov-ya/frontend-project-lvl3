import * as yup from 'yup';
import i18n from 'i18next';
import axios from 'axios';
import watcher from './watcher';
import ru from './locales/ru.js';
import addContainerAndFeeds from './controller';

export default () => {
  const state = {
    uiState: {
      form: {
        status: { isValid: {}, message: {} },
      },
      posts: [],
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
      url: i18nInst.t('validation.wrongUrl'),
    },
    mixed: {
      notOneOf: i18nInst.t('validation.duplicate'),
      required: i18nInst.t('validation.empty'),
    },
  });

  const urlSchema = yup.string().url().required();
  const form = document.querySelector('form');
  const input = form.elements.url;
  const containers = {
    feeds: document.querySelector('.feeds'),
    postContainer: document.querySelector('.posts'),
    feedback: document.querySelector('.feedback'),
    form: document.querySelector('form'),
    modalTitle: document.querySelector('.modal-title'),
    modalDescription: document.querySelector('.modal-body > p'),
    modalLink: document.querySelector('.modal-link'),
  }; // Контейнеры извлекаем один раз при инициализации, а не при каждом ререндере
  const watchedState = watcher(state, containers);

  form.addEventListener('submit', (e) => {
    const val = input.value;
    e.preventDefault();
    const submitBtn = e.currentTarget.elements.submit;
    urlSchema.notOneOf(state.urls).validate(val, { abortEarly: true })
      .then((res) => {
        if (res) {
          submitBtn.disabled = true;
          const parser = new DOMParser();
          const query = (value) => axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(value)}`, { timeout: 10000 })
            .then((response) => {
              if (response.status === 200) return response.data.contents;
              return null;
            })
            .then((content) => {
              submitBtn.disabled = false;
              const streamContent = parser.parseFromString(content, 'application/xml');
              const parserError = streamContent.querySelector('parsererror');
              if (parserError !== null) {
                watchedState.uiState.form.status = {
                  isValid: false,
                  message: i18nInst.t('errors.parser'),
                };
                return;
              }

              const rssDocument = streamContent.documentElement;
              setTimeout(() => query(val), 5000);
              if (state.urls.includes(value)) {
                addContainerAndFeeds(rssDocument, watchedState);
                return;
              }

              watchedState.uiState.form.status = {
                isValid: true,
                message: i18nInst.t('validation.success'),
              };

              // Добавляем введенный url в стейт только после успешного парсинга
              state.urls.push(value);
              addContainerAndFeeds(rssDocument, watchedState); // Тут триггерим рендер в on-watch
            })
            .catch((er) => {
              // Тут ловим сетевую ошибку
              watchedState.uiState.form.status = {
                isValid: false,
                message: i18nInst.t('errors.network'),
              };
              console.log(er);
              submitBtn.disabled = false;
            });
          query(val);
        }
      })
      // Здесь ловим ошибки валидации yup, их сообщения выше загружены через i18n в yup.setLocale
      .catch((er) => {
        e.stopPropagation();
        watchedState.uiState.form.status = {
          isValid: false,
          message: er.errors.toString(),
        };
      });
  }, false);
};
