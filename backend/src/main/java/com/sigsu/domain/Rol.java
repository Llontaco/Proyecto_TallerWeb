package com.sigsu.domain;

public enum Rol {
    ESTUDIANTE,
    TECNICO,
    SUPERVISOR,
    ADMIN;

    public boolean esGestor() {
        return this == SUPERVISOR || this == ADMIN;
    }
}
