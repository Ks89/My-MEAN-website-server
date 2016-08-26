import {Component} from '@angular/core';
import {Observable} from "rxjs/Observable";
import {Project, ProjectService} from '../../services/projects';

@Component({
  selector: 'carousel',
  styles: [require('./carousel.css')],
  template: require('./carousel.html')
})
export default class CarouselComponent {
  thumbs: Observable<Project[]>;

  constructor(private projectService: ProjectService) {
    this.thumbs = this.projectService.getProjectsForHomepage().share();
  }
}
