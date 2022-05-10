import onChange from 'on-change';

const renderValidation = (validationStatus, message) => {
  const form = document.querySelector('form');
  const input = form.elements.url;
  const feedbackMsgElem = document.querySelector('.feedback');

  switch (validationStatus) {
    case true:
      feedbackMsgElem.classList.remove('text-danger');
      feedbackMsgElem.classList.add('text-success');
      feedbackMsgElem.textContent = message;
      input.classList.remove('is-invalid');
      input.classList.add('is-valid');
      form.reset();
      input.focus();
      break;
    case false:
      feedbackMsgElem.textContent = message;
      feedbackMsgElem.classList.add('text-danger');
      input.classList.add('is-invalid');
      input.classList.remove('is-valid');
      break;
    default:
      throw new Error('Unknown form validation status!');
  }
};

export default (state) => {
  const watchedState = onChange(state, (path, val) => {
    if (path === 'form.isValid') {
      console.log(state);
      renderValidation(val, state.form.message);
    }
  });
  return watchedState;
};
