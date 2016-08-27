import {Component} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Subscription} from 'rxjs/Subscription';
import {Observable} from "rxjs/Observable";
import {ViewChild, ElementRef, AfterViewInit} from '@angular/core';
import {Project, ProjectService} from '../../common/services/projects';

declare var $:JQueryStatic;

@Component({
  selector: 'projectDetail-page',
  styles: [require('./bs_doc.css')],
  template: require('./projectDetail.html')
})
export default class ProjectDetailComponent implements AfterViewInit {
  project: Project;
  projectId: string;
  pageHeader: any;
  images: Object[];
  private subscription: Subscription;

  self = this;
  descriptionUrl : any;
  changelogUrl : any;
  releasesUrl : any;
  featuresUrl : any;
  futureExtensionsUrl : any;
  licenseUrl : any;

  @ViewChild('selectElem') el:ElementRef;


  constructor(route: ActivatedRoute,private projectService: ProjectService) {

    this.projectId = route.snapshot.params['projectId'];

    this.pageHeader = {
      title: 'Project', //that will be replaced by the projectName
      strapline: ''
    };

    this.projectService.getProjectsById(this.projectId).subscribe(
      project => {
        this.project = project;
        this.images = project.gallery;
        this.pageHeader.title = this.project.name; //replace pageHeader's title with projectName
        this.descriptionUrl = this.project.description;
        this.changelogUrl = this.project.changelog;
        this.releasesUrl = this.project.releases;
        this.featuresUrl = this.project.features;
        this.futureExtensionsUrl = this.project.futureExtensions;
        this.licenseUrl = this.project.licenseText;
      }, error => console.error(error)
    );
  }

  ngAfterViewInit() {
    $(this.el.nativeElement).click(function(){
      console.log("Jquery example");
    });
  }

  ngOnDestroy(): any {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
