package org.vaadin.addons.componentfactory;

import java.util.stream.Collectors;

import com.vaadin.flow.component.Html;
import com.vaadin.flow.component.checkbox.Checkbox;
import com.vaadin.flow.component.notification.Notification;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.component.select.Select;
import com.vaadin.flow.data.renderer.ComponentRenderer;
import com.vaadin.flow.data.renderer.TemplateRenderer;
import com.vaadin.flow.router.Route;

@Route("multiselect")
public class MultiSelectComboBoxView extends VerticalLayout {

    MultiSelectComboBox<String> combo;

    public MultiSelectComboBoxView() {
        setSizeFull();

        combo = new MultiSelectComboBox<>("Label");
        combo.setPlaceholder("placeholder");
        combo.setItems("Zero", "One", "Two", "Three", "Four", "Five", "Six",
                "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen",
                "-One", "-Two", "-Three", "-Four", "-Five", "-Six", "-Seven",
                "-Eight", "-Nine", "-Ten", "-Eleven", "-Twelve", "-Thirteen");
        combo.addValueChangeListener(e -> {
            Notification.show("Value: "
                    + e.getValue().stream().collect(Collectors.joining(",")));
        });

        Checkbox error = new Checkbox("error");
        error.addValueChangeListener(e -> {
            combo.setInvalid(error.getValue());
            combo.setErrorMessage("Error message");
        });

        Checkbox required = new Checkbox("required");
        required.addValueChangeListener(e -> {
            combo.setRequiredIndicatorVisible(required.getValue());
        });

        Checkbox helper = new Checkbox("helper");
        helper.addValueChangeListener(e -> {
            if (helper.getValue()) {
                combo.setHelperText("Helper text");
            } else {
                combo.setHelperText(null);
            }
        });

        Checkbox enabled = new Checkbox("enabled");
        enabled.setValue(true);
        enabled.addValueChangeListener(e -> {
            combo.setEnabled(enabled.getValue());
        });

        Checkbox readOnly = new Checkbox("readOnly");
        readOnly.addValueChangeListener(e -> {
            combo.setReadOnly(readOnly.getValue());
        });

        Checkbox clear = new Checkbox("clear");
        clear.addValueChangeListener(e -> {
            combo.setClearButtonVisible(clear.getValue());
        });

        Select<String> renderer = new Select<>();
        renderer.setItems("Template", "Component");
        renderer.addValueChangeListener(e -> {
            if (e.getValue().equals("Component")) {
                combo.setRenderer(new ComponentRenderer<Html, String>(item -> {
                    Html html = new Html(
                            "<span style='color: var(--lumo-primary-text-color)'><b>"
                                    + item + "</b></span>");
                    return html;
                }));
            } else if (e.getValue().equals("Template")) {
                combo.setRenderer(TemplateRenderer.<String> of(
                        "<span style='color: var(--lumo-primary-text-color)'><b>[[item.name]]</b></item>")
                        .withProperty("name", item -> item.toString()));
            }
        });

        add(combo, error, enabled, readOnly, helper, required, clear, renderer);
    }

}
