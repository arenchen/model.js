# Model.js
強調 易用 與 操控性 的 Two-Way Binding 框架。

**[Demo](https://arenchen.github.io/model.js/demo/example.html)**

## 特色
### 可直接透過 javascript 異動資料來源
```javascript
const vm = new Model(document.querySelector("#example"), {
  model: {
    firstName: "Steven",
    lastName: "Jobs"
  }
});

vm.Model.firstName = "Timothy";
vm.Model.lastName = "Cook";
```

### 可直接透過 javascript 控制綁定的 element 異動資料來源
```html
<script>
const vm = new Model(document.querySelector("#example"), {
  model: {
    firstName: "Steven",
    lastName: "Jobs"
  }
});
</script>

<div id="example">
  <span id="labFirstName" data-model="firstName"></span>
  <span id="labLastName" data-model="lastName"></span>
</div>

<script>
document.querySelector('#labFirstName').innerText = "Timothy";
document.querySelector('#labLastName').innerText = "Cook";
</script>
```
