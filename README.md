# Accessible ComboBox project

Accessible version of ComboBox for Vaadin 14 based web component of Vaadin 23, which has been rewritten for better accessibility. The Java API us the same as regular Vaadin 14 ComboBox. The web component name has been renamed to vcf-combo-box to avoid duplicate component registration.

## Development instructions

### Important Files 
* ComboBox.java: this is the addon-on component class.
* View.java: A View class that let's you test the component you are building. 
* src/main/resources/META-INF/resources/frontend/src contains actual web component, mostly copied from Vaadin 23. 

### Deployment

Starting the test/demo server:
```
mvn jetty:run
```

This deploys demo at http://localhost:8080
 
### Integration test

To run Integration Tests, execute `mvn verify -Pit,production`.

## Publishing to Vaadin Directory

You should change the `organisation.name` property in `pom.xml` to your own name/organization.

```
    <organization>
        <name>###author###</name>
    </organization>
```

You can create the zip package needed for [Vaadin Directory](https://vaadin.com/directory/) using

```
mvn versions:set -DnewVersion=1.0.0 # You cannot publish snapshot versions 
mvn install -Pdirectory
```

The package is created as `target/accessible-combo-box-1.0.0.zip`

For more information or to upload the package, visit https://vaadin.com/directory/my-components?uploadNewComponent
