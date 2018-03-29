import { Component, Input, OnInit, ChangeDetectorRef, ViewChildren, QueryList, ComponentFactoryResolver, Injector, Inject } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { ActivatedRoute, Router, NavigationExtras } from '@angular/router';

import {
    CMS,
    UIHint,
    InsertPointDirective,
    ContentService,
    CmsComponentConfig,
    CmsWidgetPosition
} from '@angular-cms/core';

@Component({
    templateUrl: './editor-layout.component.html',
    styleUrls: ['./editor-layout.component.scss']
})
export class EditorLayoutComponent {
    @ViewChildren(InsertPointDirective) insertPoints: QueryList<InsertPointDirective>;
    private componentRefs: Array<any> = [];
    private defaulGroup: string = 'Global';

    rightTabs: Array<any> = [];
    leftTabs: Array<any> = [];

    constructor(
        @Inject(ComponentFactoryResolver) private componentFactoryResolver: ComponentFactoryResolver,
        private _changeDetectionRef: ChangeDetectorRef,
        private injector: Injector,
        private contentService: ContentService,
        private route: ActivatedRoute) { }

    ngOnInit() {
        this.rightTabs = this.initWidgetTab(CmsWidgetPosition.Right);
        this.leftTabs = this.initWidgetTab(CmsWidgetPosition.Left);
    }

    ngAfterViewInit() {
        // BUGFIX: https://github.com/angular/angular/issues/6005#issuecomment-165911194
        //setTimeout(_ => this.initCreatingWidget()) 
        this.creatingEditorWidget();
        this._changeDetectionRef.detectChanges();
    }

    private creatingEditorWidget() {
        this.initWidgets(this.rightTabs, CmsWidgetPosition.Right);
        this.initWidgets(this.leftTabs, CmsWidgetPosition.Left);
    }

    private initTopWidgets(){

    }

    private initWidgets(tabs: Array<any>, position: CmsWidgetPosition) {
        if (tabs) {
            tabs.forEach(tab => {
                let viewContainerRef = this.insertPoints.find(x => x.name == tab.content).viewContainerRef;
                viewContainerRef.clear();
                CMS.EDITOR_WIDGETS().filter(x => x.position == position && (x.group == tab.title || (!x.group && tab.title == this.defaulGroup))).forEach(widget => {
                    this.componentRefs.push(this.createWidget(viewContainerRef, widget));
                });
            });
        }
    }

    private initWidgetTab(position: CmsWidgetPosition): Array<any> {
        let tabs = [];
        let widgets = CMS.EDITOR_WIDGETS().filter(widget => widget.position == position);

        widgets.forEach(widget => {
            if(widget.hasOwnProperty('group')) {
                if (tabs.findIndex(x => x.title == widget.group) == -1) {
                    tabs.push({ title: widget.group, content: `${position}_${widget.group}` });
                }
            }
        });

        if (widgets.findIndex(widget => !widget.group) != -1) {
            tabs.push({ title: this.defaulGroup, content: `${position}_${this.defaulGroup}` });
        }

        return tabs.sort(this.sortByTitle);
    }

    private createWidget(viewContainerRef, widget: CmsComponentConfig): any {
        let componentFactory = this.componentFactoryResolver.resolveComponentFactory(widget.component);
        return viewContainerRef.createComponent(componentFactory);
    }

    private sortByTitle(a, b): number {
        var nameA = a.title.toUpperCase(); // ignore upper and lowercase
        var nameB = b.title.toUpperCase(); // ignore upper and lowercase
        if (nameA < nameB) {
            return -1;
        }
        if (nameA > nameB) {
            return 1;
        }
        // names must be equal
        return 0;
    }

    ngOnDestroy() {
        if (this.componentRefs) {
            this.componentRefs.forEach(cmpref => {
                cmpref.destroy();
            })
            this.componentRefs = [];
        }
    }
}
