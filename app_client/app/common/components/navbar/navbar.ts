import {Component} from '@angular/core';

@Component({
  selector: 'navigation',
  template: require('./navbar.html'),
})
export default class NavbarComponent {

  //TODO FIXME replace with a real impl calling the service
  isLoggedIn: boolean = false;
  currentUser: any = {name : 'fake'};
  currentPath: string = 'fakeString';
}
