package de.lunchrunner.backend.service;

import de.lunchrunner.backend.model.options.OptionGroupDefinition;
import de.lunchrunner.backend.model.options.OptionValueDefinition;
import de.lunchrunner.backend.model.options.OptionsDefinition;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Service
public class OptionsValidationService {

    public void validateSelection(OptionsDefinition optionsDefinition, Map<String, Object> selectedOptions) {
        if (optionsDefinition == null || optionsDefinition.getGroups() == null) {
            return;
        }
        if (selectedOptions == null || selectedOptions.isEmpty()) {
            return;
        }

        final Set<String> availableGroupIds = optionsDefinition.getGroups().stream()
                .map(OptionGroupDefinition::getId)
                .filter(Objects::nonNull)
                .collect(java.util.stream.Collectors.toSet());

        for (String groupId : selectedOptions.keySet()) {
            if (!availableGroupIds.contains(groupId)) {
                throw new IllegalArgumentException("Unknown option group: " + groupId);
            }
        }

        for (OptionGroupDefinition group : optionsDefinition.getGroups()) {
            Object value = selectedOptions.get(group.getId());
            if (value == null) {
                continue;
            }
            if (group.getType() == OptionGroupDefinition.GroupType.single) {
                if (!(value instanceof String valueString) || valueString.isBlank()) {
                    throw new IllegalArgumentException("Single-select option must be a non-empty string");
                }
                ensureValueExists(group, valueString);
            } else if (group.getType() == OptionGroupDefinition.GroupType.multi) {
                if (!(value instanceof Collection<?> valueCollection)) {
                    throw new IllegalArgumentException("Multi-select option must be an array");
                }
                for (Object entry : valueCollection) {
                    if (!(entry instanceof String entryString) || entryString.isBlank()) {
                        throw new IllegalArgumentException("Multi-select values must be non-empty strings");
                    }
                    ensureValueExists(group, entryString);
                }
            } else {
                throw new IllegalArgumentException("Unsupported option group type: " + group.getType());
            }
        }
    }

    private void ensureValueExists(OptionGroupDefinition group, String value) {
        final List<OptionValueDefinition> definitions = group.getValues();
        if (definitions == null || definitions.stream().noneMatch(option -> option.getLabel().equals(value))) {
            throw new IllegalArgumentException("Invalid option value: " + value);
        }
    }
}
