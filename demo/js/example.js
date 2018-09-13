/*jshint esversion: 6 */
const code = document.querySelector('code');

vm = new Model(document.querySelector('#example'), {
  model: {
    title: 'Mr.',
    firstName: 'Steven',
    lastName: 'Jobs',
    countryId: 'us',
    enabled: true,
    countries: [
      { id: 'tw', name: 'Taiwan' },
      { id: 'us', name: 'United States' },
      { id: 'jp', name: 'Japan' }
    ]
  }
});

getModel();

function reset() {
  vm.Model = {
    title: 'Mr.',
    firstName: 'Steven',
    lastName: 'Jobs',
    countryId: 'us',
    enabled: true,
    countries: [
      { id: 'tw', name: 'Taiwan' },
      { id: 'us', name: 'United States' },
      { id: 'jp', name: 'Japan' }
    ]
  };

  getModel();
}

function getModel() {
  setTimeout(() => {
    code.innerHTML = JSON.stringify(vm.UnbindingModel, null, 4);
    Prism.highlightAll();
  }, 10);
}

function testWithModel() {
  vm.Model.firstName = 'Timothy';
  vm.Model.lastName = 'Cook';
  vm.Model.title = 'Mr.';
  vm.Model.countryId = 'tw';
  vm.Model.dynamicText = 'Hello, World!';

  getModel();
}

function testWithElement() {
  document.querySelector('#txtTitle').innerText = 'Ms.';
  document.querySelector('#txtFirstName').value = 'Taylor';
  document.querySelector('#txtLastName').value = 'Swift';
  document.querySelector('#selCountry').value = 'jp';

  getModel();
}