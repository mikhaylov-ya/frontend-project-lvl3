import * as yup from 'yup';
import watcher from './watcher';

export default () => {
  const state = {
    form: {
      isValid: {},
      errorMsg: {},
      urls: [],
    },
  };

  const urlSchema = yup.string().url('yo bro dis is not url stop shittin me');
  const form = document.querySelector('form');
  const input = form.elements.url;
  const watchedState = watcher(state);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    urlSchema.notOneOf(state.form.urls, 'yo bro ya already add this to the feed').validate(input.value, { abortEarly: true })
      .then((res) => {
        if (res) {
          watchedState.form.isValid = true;
          watchedState.form.urls.push(input.value);
        }
      })
      .catch((er) => {
        e.stopPropagation();
        state.form.errorMsg = er.errors.toString();
        watchedState.form.isValid = false;
      });
  }, false);
};
