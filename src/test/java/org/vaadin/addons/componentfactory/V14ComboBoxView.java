package org.vaadin.addons.componentfactory;

import com.vaadin.flow.component.Html;
import com.vaadin.flow.component.checkbox.Checkbox;
import com.vaadin.flow.component.notification.Notification;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.data.renderer.ComponentRenderer;
import com.vaadin.flow.router.Route;
import com.vaadin.flow.component.combobox.ComboBox;

@Route("v14")
public class V14ComboBoxView extends VerticalLayout {

    ComboBox<String> combo;

    public V14ComboBoxView() {
        setSizeFull();

        combo = new ComboBox<>("Label");
        combo.setPlaceholder("placeholder");
        combo.setItems("Zero", "One", "Two", "Three", "Four", "Five", "Six",
                "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen",
                "-One", "-Two", "-Three", "-Four", "-Five", "-Six", "-Seven",
                "-Eight", "-Nine", "-Ten", "-Eleven", "-Twelve", "-Thirteen");
        combo.addValueChangeListener(e -> {
            Notification.show("Value: " + e.getValue());
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

        combo.setRenderer(new ComponentRenderer<Html, String>(item -> {
            Html html = new Html(
                    "<span style='color: var(--lumo-primary-text-color)'><b>"
                            + item + "</b></span>");
            return html;
        }));

        add(combo, error, enabled, readOnly, helper, required, clear);
    }

}
