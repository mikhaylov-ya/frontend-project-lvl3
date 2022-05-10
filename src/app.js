import * as yup from 'yup';
import i18n from 'i18next';
import watcher from './watcher';
import ru from './locales/ru.js';

export default () => {
  const state = {
    form: {
      isValid: {},
      message: {},
      urls: [],
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
  const watchedState = watcher(state);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    urlSchema.notOneOf(state.form.urls).validate(input.value, { abortEarly: true })
      .then((res) => {
        if (res) {
          watchedState.form.urls.push(input.value);
          state.form.message = i18nInst.t('validation.success');
          watchedState.form.isValid = true;
        }
      })
      .catch((er) => {
        e.stopPropagation();
        state.form.message = er.errors.toString();
        watchedState.form.isValid = false;
      });
  }, false);
};
