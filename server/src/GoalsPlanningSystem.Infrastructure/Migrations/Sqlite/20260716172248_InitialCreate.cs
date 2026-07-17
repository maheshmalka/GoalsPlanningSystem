using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GoalsPlanningSystem.Infrastructure.Migrations.Sqlite
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AssetClasses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    ExpectedAnnualReturnPct = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: false),
                    AnnualVolatilityPct = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssetClasses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CapitalGainsRules",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    AssetCategory = table.Column<int>(type: "INTEGER", nullable: false),
                    HoldingPeriodMonthsThreshold = table.Column<int>(type: "INTEGER", nullable: false),
                    ShortTermTaxedAtSlabRate = table.Column<bool>(type: "INTEGER", nullable: false),
                    ShortTermRatePct = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: false),
                    LongTermRatePct = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: false),
                    LongTermExemptionAmount = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CapitalGainsRules", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RiskQuestions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    DisplayOrder = table.Column<int>(type: "INTEGER", nullable: false),
                    Text = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RiskQuestions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TaxSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Regime = table.Column<int>(type: "INTEGER", nullable: false),
                    StandardDeduction = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: false),
                    RebateIncomeThreshold = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: false),
                    RebateMaxAmount = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: false),
                    CessPct = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaxSettings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TaxSlabs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Regime = table.Column<int>(type: "INTEGER", nullable: false),
                    SlabOrder = table.Column<int>(type: "INTEGER", nullable: false),
                    LowerBound = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: false),
                    UpperBound = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: true),
                    RatePct = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaxSlabs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AssetClassCorrelations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    AssetClassAId = table.Column<int>(type: "INTEGER", nullable: false),
                    AssetClassBId = table.Column<int>(type: "INTEGER", nullable: false),
                    Correlation = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssetClassCorrelations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AssetClassCorrelations_AssetClasses_AssetClassAId",
                        column: x => x.AssetClassAId,
                        principalTable: "AssetClasses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AssetClassCorrelations_AssetClasses_AssetClassBId",
                        column: x => x.AssetClassBId,
                        principalTable: "AssetClasses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RiskQuestionOptions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    RiskQuestionId = table.Column<int>(type: "INTEGER", nullable: false),
                    DisplayOrder = table.Column<int>(type: "INTEGER", nullable: false),
                    Text = table.Column<string>(type: "TEXT", nullable: false),
                    Points = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RiskQuestionOptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RiskQuestionOptions_RiskQuestions_RiskQuestionId",
                        column: x => x.RiskQuestionId,
                        principalTable: "RiskQuestions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AccountAllocations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    AccountId = table.Column<int>(type: "INTEGER", nullable: false),
                    AssetClassId = table.Column<int>(type: "INTEGER", nullable: false),
                    Percentage = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AccountAllocations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AccountAllocations_AssetClasses_AssetClassId",
                        column: x => x.AssetClassId,
                        principalTable: "AssetClasses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Accounts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ClientId = table.Column<int>(type: "INTEGER", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    AccountType = table.Column<int>(type: "INTEGER", nullable: false),
                    CurrentBalance = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: false),
                    ContributionAmount = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: false),
                    ContributionFrequency = table.Column<int>(type: "INTEGER", nullable: false),
                    EmployerMatchPct = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: true),
                    NpsAnnuitizationPct = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: true),
                    AssumedAnnuityRatePct = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Accounts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Clients",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    PlanId = table.Column<int>(type: "INTEGER", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    DateOfBirth = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    RetirementAge = table.Column<int>(type: "INTEGER", nullable: false),
                    LifeExpectancyAge = table.Column<int>(type: "INTEGER", nullable: false),
                    TaxRegime = table.Column<int>(type: "INTEGER", nullable: false),
                    TotalDeductionsAmount = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: false),
                    RiskScore = table.Column<int>(type: "INTEGER", nullable: true),
                    RiskProfile = table.Column<int>(type: "INTEGER", nullable: true),
                    RiskProfileOverride = table.Column<int>(type: "INTEGER", nullable: true),
                    Notes = table.Column<string>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Clients", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Incomes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ClientId = table.Column<int>(type: "INTEGER", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    IncomeType = table.Column<int>(type: "INTEGER", nullable: false),
                    AnnualAmount = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: false),
                    StartYear = table.Column<int>(type: "INTEGER", nullable: false),
                    EndYear = table.Column<int>(type: "INTEGER", nullable: true),
                    AnnualGrowthRatePct = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Incomes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Incomes_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Plans",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    PrimaryClientId = table.Column<int>(type: "INTEGER", nullable: true),
                    InflationRatePct = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: false),
                    SimulationCount = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Plans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Plans_Clients_PrimaryClientId",
                        column: x => x.PrimaryClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "RiskQuestionnaireResponses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ClientId = table.Column<int>(type: "INTEGER", nullable: false),
                    RiskQuestionId = table.Column<int>(type: "INTEGER", nullable: false),
                    RiskQuestionOptionId = table.Column<int>(type: "INTEGER", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RiskQuestionnaireResponses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RiskQuestionnaireResponses_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RiskQuestionnaireResponses_RiskQuestionOptions_RiskQuestionOptionId",
                        column: x => x.RiskQuestionOptionId,
                        principalTable: "RiskQuestionOptions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RiskQuestionnaireResponses_RiskQuestions_RiskQuestionId",
                        column: x => x.RiskQuestionId,
                        principalTable: "RiskQuestions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Expenses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    PlanId = table.Column<int>(type: "INTEGER", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Category = table.Column<int>(type: "INTEGER", nullable: false),
                    AnnualAmount = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: false),
                    StartYear = table.Column<int>(type: "INTEGER", nullable: false),
                    EndYear = table.Column<int>(type: "INTEGER", nullable: true),
                    GrowthRateOverridePct = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Expenses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Expenses_Plans_PlanId",
                        column: x => x.PlanId,
                        principalTable: "Plans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Goals",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    PlanId = table.Column<int>(type: "INTEGER", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    GoalType = table.Column<int>(type: "INTEGER", nullable: false),
                    TargetAmount = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: false),
                    Priority = table.Column<int>(type: "INTEGER", nullable: false),
                    StartYear = table.Column<int>(type: "INTEGER", nullable: false),
                    EndYear = table.Column<int>(type: "INTEGER", nullable: false),
                    IsRecurring = table.Column<bool>(type: "INTEGER", nullable: false),
                    GrowthRateOverridePct = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Goals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Goals_Plans_PlanId",
                        column: x => x.PlanId,
                        principalTable: "Plans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GoalAccountLinks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    GoalId = table.Column<int>(type: "INTEGER", nullable: false),
                    AccountId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GoalAccountLinks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GoalAccountLinks_Accounts_AccountId",
                        column: x => x.AccountId,
                        principalTable: "Accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_GoalAccountLinks_Goals_GoalId",
                        column: x => x.GoalId,
                        principalTable: "Goals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AccountAllocations_AccountId_AssetClassId",
                table: "AccountAllocations",
                columns: new[] { "AccountId", "AssetClassId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AccountAllocations_AssetClassId",
                table: "AccountAllocations",
                column: "AssetClassId");

            migrationBuilder.CreateIndex(
                name: "IX_Accounts_ClientId",
                table: "Accounts",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_AssetClassCorrelations_AssetClassAId_AssetClassBId",
                table: "AssetClassCorrelations",
                columns: new[] { "AssetClassAId", "AssetClassBId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AssetClassCorrelations_AssetClassBId",
                table: "AssetClassCorrelations",
                column: "AssetClassBId");

            migrationBuilder.CreateIndex(
                name: "IX_AssetClasses_Name",
                table: "AssetClasses",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CapitalGainsRules_AssetCategory",
                table: "CapitalGainsRules",
                column: "AssetCategory",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Clients_PlanId",
                table: "Clients",
                column: "PlanId");

            migrationBuilder.CreateIndex(
                name: "IX_Expenses_PlanId",
                table: "Expenses",
                column: "PlanId");

            migrationBuilder.CreateIndex(
                name: "IX_GoalAccountLinks_AccountId",
                table: "GoalAccountLinks",
                column: "AccountId");

            migrationBuilder.CreateIndex(
                name: "IX_GoalAccountLinks_GoalId",
                table: "GoalAccountLinks",
                column: "GoalId");

            migrationBuilder.CreateIndex(
                name: "IX_Goals_PlanId",
                table: "Goals",
                column: "PlanId");

            migrationBuilder.CreateIndex(
                name: "IX_Incomes_ClientId",
                table: "Incomes",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_Plans_PrimaryClientId",
                table: "Plans",
                column: "PrimaryClientId");

            migrationBuilder.CreateIndex(
                name: "IX_RiskQuestionnaireResponses_ClientId_RiskQuestionId",
                table: "RiskQuestionnaireResponses",
                columns: new[] { "ClientId", "RiskQuestionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RiskQuestionnaireResponses_RiskQuestionId",
                table: "RiskQuestionnaireResponses",
                column: "RiskQuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_RiskQuestionnaireResponses_RiskQuestionOptionId",
                table: "RiskQuestionnaireResponses",
                column: "RiskQuestionOptionId");

            migrationBuilder.CreateIndex(
                name: "IX_RiskQuestionOptions_RiskQuestionId",
                table: "RiskQuestionOptions",
                column: "RiskQuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_TaxSettings_Regime",
                table: "TaxSettings",
                column: "Regime",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TaxSlabs_Regime_SlabOrder",
                table: "TaxSlabs",
                columns: new[] { "Regime", "SlabOrder" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_AccountAllocations_Accounts_AccountId",
                table: "AccountAllocations",
                column: "AccountId",
                principalTable: "Accounts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Accounts_Clients_ClientId",
                table: "Accounts",
                column: "ClientId",
                principalTable: "Clients",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Clients_Plans_PlanId",
                table: "Clients",
                column: "PlanId",
                principalTable: "Plans",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Plans_Clients_PrimaryClientId",
                table: "Plans");

            migrationBuilder.DropTable(
                name: "AccountAllocations");

            migrationBuilder.DropTable(
                name: "AssetClassCorrelations");

            migrationBuilder.DropTable(
                name: "CapitalGainsRules");

            migrationBuilder.DropTable(
                name: "Expenses");

            migrationBuilder.DropTable(
                name: "GoalAccountLinks");

            migrationBuilder.DropTable(
                name: "Incomes");

            migrationBuilder.DropTable(
                name: "RiskQuestionnaireResponses");

            migrationBuilder.DropTable(
                name: "TaxSettings");

            migrationBuilder.DropTable(
                name: "TaxSlabs");

            migrationBuilder.DropTable(
                name: "AssetClasses");

            migrationBuilder.DropTable(
                name: "Accounts");

            migrationBuilder.DropTable(
                name: "Goals");

            migrationBuilder.DropTable(
                name: "RiskQuestionOptions");

            migrationBuilder.DropTable(
                name: "RiskQuestions");

            migrationBuilder.DropTable(
                name: "Clients");

            migrationBuilder.DropTable(
                name: "Plans");
        }
    }
}
