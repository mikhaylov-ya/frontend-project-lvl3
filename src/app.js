import * as yup from 'yup';
import i18n from 'i18next';
import axios from 'axios';
import watcher from './watcher';
import ru from './locales/ru.js';
import { addFeed, addPosts } from './controller';

export default () => {
  const state = {
    form: {
      status: { isValid: {}, message: {} },
      urls: [],
      data: {
        posts: [],
        feeds: [],
      },
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
    },
  });

  const urlSchema = yup.string().url();
  const form = document.querySelector('form');
  const input = form.elements.url;
  const containers = {
    feeds: document.querySelector('.feeds'),
    posts: document.querySelector('.posts'),
    feedback: document.querySelector('.feedback'),
    form: document.querySelector('form'),
  }; // Контейнеры извлекаем один раз при инициализации, а не при каждом ререндере
  const watchedState = watcher(state, containers);

  form.addEventListener('submit', (e) => {
    const val = input.value;
    e.preventDefault();
    urlSchema.notOneOf(state.form.urls).validate(val, { abortEarly: true })
      .then((res) => {
        if (res) {
          const parser = new DOMParser();
          axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(val)}`)
            .then((response) => {
              if (response.status === 200) return response.data.contents;
              // Тут ловим сетевую ошибку (можно и через catch)
              e.stopPropagation();
              watchedState.form.status = {
                isValid: false,
                message: i18nInst.t('errors.network'),
              };
              return null;
            })
            .then((content) => {
              const streamContent = parser.parseFromString(content, 'application/xml');
              const parserError = streamContent.querySelector('parsererror');
              if (parserError !== null) {
                watchedState.form.status = {
                  isValid: false,
                  message: i18nInst.t('errors.parser'),
                };
                return;
              }
              // Добавляем введенный url в стейт только после успешного парсинга
              state.form.urls.push(val);
              watchedState.form.status = {
                isValid: true,
                message: i18nInst.t('validation.success'),
              };
              const rssDocument = streamContent.documentElement;
              addPosts(rssDocument, state); // Добавляем в стейт, но не триггерим рендер
              addFeed(rssDocument, watchedState); // Тут триггерим рендер в on-watch
            });
        }
      })
      // Здесь ловим ошибки валидации yup, их сообщения выше загружены через i18n
      // в yup.setLocale
      .catch((er) => {
        e.stopPropagation();
        watchedState.form.status = {
          isValid: false,
          message: er.errors.toString(),
        };
      });
  }, false);
};
