const app = angular.module("app", []);

class MyAppCtrl {
}

app.component("myApp", {
  template: `<history></history>`,
  controller: MyAppCtrl
});

class HistoryCtrl {
  constructor($http) {
    $http.get('/api/history/list').success((data) => {
      console.log(data);
      this.history = data.history;
    });
  }
}

app.component("history", {
  template: `
    <figure ng-repeat="url in $ctrl.history">
      <img src={{url}}>
      <figcation><a href={{url}} target="_blank">{{url}}</a></figcation>
    </figure>
  `,
  controller: HistoryCtrl
});

angular.bootstrap(document.body, [app.name]);